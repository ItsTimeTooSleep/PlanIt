"use client";

import { format, parseISO } from "date-fns";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	FlaskConical,
	Lightbulb,
	Play,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import type { RecommendTag } from "@/lib/smart-recommend/types";
import {
	buildReport,
	buildScenarios,
	runAllScenarios,
	runScenario,
} from "@/lib/smart-recommend/duplicate-test";
import type {
	AggregateReport,
	ScenarioCategory,
	TestResult,
	TestScenario,
} from "@/lib/smart-recommend/duplicate-test/types";
import { cn } from "@/lib/utils";

interface DuplicatePredictionTestProps {
	tags: RecommendTag[];
}

type CategoryFilter = ScenarioCategory | "all";

const CATEGORY_ORDER: ScenarioCategory[] = [
	"exact",
	"near",
	"behavior",
	"periodic",
	"boundary",
];

export function DuplicatePredictionTest({ tags }: DuplicatePredictionTestProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const dt = t.duplicateTest;

	const [scenarios] = useState<TestScenario[]>(() => buildScenarios(new Date()));
	const [results, setResults] = useState<Record<string, TestResult>>({});
	const [filter, setFilter] = useState<CategoryFilter>("all");

	const filteredScenarios = useMemo(() => {
		if (filter === "all") return scenarios;
		return scenarios.filter((s) => s.category === filter);
	}, [scenarios, filter]);

	const report = useMemo<AggregateReport | null>(() => {
		if (Object.keys(results).length === 0) return null;
		return buildReport(scenarios, results);
	}, [scenarios, results]);

	const handleRunAll = useCallback(() => {
		const { results: nextResults } = runAllScenarios(scenarios, tags);
		setResults(nextResults);
	}, [scenarios, tags]);

	const handleRunSingle = useCallback(
		(scenarioId: string) => {
			const scenario = scenarios.find((s) => s.id === scenarioId);
			if (!scenario) return;
			const result = runScenario(scenario, tags);
			setResults((prev) => ({ ...prev, [scenarioId]: result }));
		},
		[scenarios, tags],
	);

	const handleReset = useCallback(() => {
		setResults({});
	}, []);

	const stats = useMemo(() => {
		const total = scenarios.length;
		const executed = Object.keys(results).length;
		const passed = Object.values(results).filter((r) => r.status === "passed").length;
		const failed = Object.values(results).filter((r) => r.status === "failed").length;
		const passRate = executed > 0 ? passed / executed : 0;
		return { total, executed, passed, failed, passRate };
	}, [scenarios, results]);

	return (
		<div className="flex flex-col gap-4">
			<HeaderCard
				title={dt.title}
				description={dt.description}
				runAllLabel={dt.runAll}
				resetLabel={dt.reset}
				filter={filter}
				onFilterChange={setFilter}
				onRunAll={handleRunAll}
				onReset={handleReset}
				catAllLabel={dt.catAll}
				catLabels={{
					exact: dt.catExact,
					near: dt.catNear,
					behavior: dt.catBehavior,
					periodic: dt.catPeriodic,
					boundary: dt.catBoundary,
				}}
			/>

			<SummaryRow
				totalLabel={dt.scenarioList}
				passedLabel={dt.statusPassed}
				failedLabel={dt.statusFailed}
				passRateLabel={dt.passRate}
				stats={stats}
			/>

			{report && (
				<ReportCard
					report={report}
					scenarios={scenarios}
					scenarioLabels={dt.scenarios}
					commonPatternsLabel={dt.commonPatterns}
					prioritizedSuggestionsLabel={dt.prioritizedSuggestions}
					affectedCountLabel={dt.flaggedCount}
				/>
			)}

			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<FlaskConical className="w-3.5 h-3.5" />
					<span>
						{dt.scenarioList} · {filteredScenarios.length}
					</span>
				</div>
				{filteredScenarios.map((scenario) => (
					<ScenarioCard
						key={scenario.id}
						scenario={scenario}
						result={results[scenario.id]}
						onRun={() => handleRunSingle(scenario.id)}
						runLabel={dt.runSingle}
						rerunLabel={dt.rerun}
						catLabel={categoryLabel(scenario.category, dt)}
						labels={{
							statusPending: dt.statusPending,
							statusPassed: dt.statusPassed,
							statusFailed: dt.statusFailed,
							desc: scenarioLabel(scenario.id, dt.scenarios)?.desc ?? scenario.id,
							expected: dt.expected,
							actual: dt.actual,
							diff: dt.diff,
							anomalyAnalysis: dt.anomalyAnalysis,
							optimizationSuggestion: dt.optimizationSuggestion,
							initialTasks: dt.initialTasks,
							contextTimeLabel: dt.contextTimeLabel,
							createdTask: dt.createdTask,
							flaggedCount: dt.flaggedCount,
							noRecommendations: dt.noRecommendations,
							matchedCriteria: dt.matchedCriteria,
							anomaly: scenarioLabel(scenario.id, dt.scenarios)?.anomaly ?? "",
							suggestion: scenarioLabel(scenario.id, dt.scenarios)?.suggestion ?? "",
						}}
					/>
				))}
			</div>
		</div>
	);
}

interface HeaderCardProps {
	title: string;
	description: string;
	runAllLabel: string;
	resetLabel: string;
	filter: CategoryFilter;
	onFilterChange: (value: CategoryFilter) => void;
	onRunAll: () => void;
	onReset: () => void;
	catAllLabel: string;
	catLabels: Record<ScenarioCategory, string>;
}

function HeaderCard(props: HeaderCardProps) {
	return (
		<Card>
			<CardHeader className="pb-2 pt-4 px-4">
				<div className="flex items-center justify-between gap-3 flex-wrap">
					<CardTitle className="text-sm flex items-center gap-2">
						<AlertTriangle className="w-4 h-4 text-amber-500" />
						{props.title}
					</CardTitle>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1.5">
							<Label className="text-[10px] text-muted-foreground">{props.catAllLabel}</Label>
							<Select
								value={props.filter}
								onValueChange={(v) => props.onFilterChange(v as CategoryFilter)}
							>
								<SelectTrigger className="h-7 text-xs w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{props.catAllLabel}</SelectItem>
									{CATEGORY_ORDER.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{props.catLabels[cat]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button size="sm" className="h-7 text-xs" onClick={props.onRunAll}>
							<Play className="w-3 h-3 mr-1" />
							{props.runAllLabel}
						</Button>
						<Button size="sm" variant="outline" className="h-7 text-xs" onClick={props.onReset}>
							<RotateCcw className="w-3 h-3 mr-1" />
							{props.resetLabel}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-4 pb-3">
				<p className="text-xs text-muted-foreground">{props.description}</p>
			</CardContent>
		</Card>
	);
}

interface SummaryRowProps {
	totalLabel: string;
	passedLabel: string;
	failedLabel: string;
	passRateLabel: string;
	stats: { total: number; executed: number; passed: number; failed: number; passRate: number };
}

function SummaryRow(props: SummaryRowProps) {
	const pending = props.stats.total - props.stats.executed;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			<SummaryCard
				icon={<FlaskConical className="w-4 h-4 text-muted-foreground" />}
				label={props.totalLabel}
				value={`${props.stats.executed}/${props.stats.total}`}
				sub={`${pending} pending`}
			/>
			<SummaryCard
				icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
				label={props.passedLabel}
				value={String(props.stats.passed)}
				sub={props.passedLabel}
			/>
			<SummaryCard
				icon={<XCircle className="w-4 h-4 text-red-500" />}
				label={props.failedLabel}
				value={String(props.stats.failed)}
				sub={props.failedLabel}
			/>
			<SummaryCard
				icon={<Lightbulb className="w-4 h-4 text-amber-500" />}
				label={props.passRateLabel}
				value={`${(props.stats.passRate * 100).toFixed(1)}%`}
				sub={props.passRateLabel}
			/>
		</div>
	);
}

interface SummaryCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub: string;
}

function SummaryCard(props: SummaryCardProps) {
	return (
		<Card>
			<CardContent className="px-4 py-3">
				<div className="flex items-center gap-2 mb-1">
					{props.icon}
					<span className="text-xs text-muted-foreground">{props.label}</span>
				</div>
				<div className="text-xl font-bold">{props.value}</div>
				<div className="text-[10px] text-muted-foreground">{props.sub}</div>
			</CardContent>
		</Card>
	);
}

interface ReportCardProps {
	report: AggregateReport;
	scenarios: TestScenario[];
	scenarioLabels: ScenarioLabelMap;
	commonPatternsLabel: string;
	prioritizedSuggestionsLabel: string;
	affectedCountLabel: string;
}

function ReportCard(props: ReportCardProps) {
	return (
		<Card>
			<CardHeader className="pb-2 pt-4 px-4">
				<CardTitle className="text-sm flex items-center gap-2">
					<Lightbulb className="w-4 h-4 text-amber-500" />
					{props.prioritizedSuggestionsLabel}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-4 pb-4 flex flex-col gap-4">
				<div>
					<div className="text-xs font-medium mb-2 flex items-center gap-1.5">
						<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
						{props.commonPatternsLabel}
					</div>
					{props.report.commonFailurePatterns.length === 0 ? (
						<p className="text-[11px] text-muted-foreground">—</p>
					) : (
						<div className="flex flex-col gap-1.5">
							{props.report.commonFailurePatterns.map((pattern) => {
								const scenario = props.scenarios.find(
									(s) => s.anomalyAnalysisKey === pattern.patternKey,
								);
								const anomalyText = scenario
									? props.scenarioLabels[scenario.id]?.anomaly ?? scenario.id
									: pattern.patternKey;
								return (
									<div
										key={pattern.patternKey}
										className="flex items-center justify-between bg-muted/30 rounded px-2 py-1.5 gap-2"
									>
										<span className="text-xs truncate flex-1 min-w-0" title={anomalyText}>
											{anomalyText}
										</span>
										<Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
											×{pattern.count}
										</Badge>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div>
					<div className="text-xs font-medium mb-2 flex items-center gap-1.5">
						<Lightbulb className="w-3.5 h-3.5 text-amber-500" />
						{props.prioritizedSuggestionsLabel}
					</div>
					{props.report.prioritizedSuggestions.length === 0 ? (
						<p className="text-[11px] text-muted-foreground">—</p>
					) : (
						<div className="flex flex-col gap-1.5">
							{props.report.prioritizedSuggestions.map((suggestion) => {
								const scenario = props.scenarios.find(
									(s) => s.optimizationSuggestionKey === suggestion.suggestionKey,
								);
								const suggestionText = scenario
									? props.scenarioLabels[scenario.id]?.suggestion ?? scenario.id
									: suggestion.suggestionKey;
								return (
									<div
										key={suggestion.suggestionKey}
										className="flex items-start justify-between bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5 gap-2"
									>
										<span className="text-[11px] flex-1 min-w-0 leading-relaxed">
											{suggestionText}
										</span>
										<Badge
											variant="secondary"
											className="text-[10px] h-4 px-1.5 bg-amber-500/10 text-amber-600 shrink-0"
										>
											{props.affectedCountLabel}: {suggestion.affectedScenarioIds.length}
										</Badge>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className="grid grid-cols-5 gap-2 pt-2 border-t">
					{CATEGORY_ORDER.map((cat) => {
						const stat = props.report.byCategory[cat];
						return (
							<div key={cat} className="text-center">
								<div className="text-[10px] text-muted-foreground mb-0.5">{cat}</div>
								<div className="text-xs font-semibold">
									{stat.passed}/{stat.total}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

interface ScenarioCardProps {
	scenario: TestScenario;
	result: TestResult | undefined;
	onRun: () => void;
	runLabel: string;
	rerunLabel: string;
	catLabel: string;
	labels: {
		statusPending: string;
		statusPassed: string;
		statusFailed: string;
		desc: string;
		expected: string;
		actual: string;
		diff: string;
		anomalyAnalysis: string;
		optimizationSuggestion: string;
		initialTasks: string;
		contextTimeLabel: string;
		createdTask: string;
		flaggedCount: string;
		noRecommendations: string;
		matchedCriteria: string;
		anomaly: string;
		suggestion: string;
	};
}

function ScenarioCard(props: ScenarioCardProps) {
	const { scenario, result } = props;
	const status = result?.status ?? "pending";
	const statusLabel =
		status === "passed"
			? props.labels.statusPassed
			: status === "failed"
				? props.labels.statusFailed
				: props.labels.statusPending;

	return (
		<Card className={cn(status === "failed" && "border-red-500/40")}>
			<CardHeader className="pb-2 pt-4 px-4">
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<div className="flex items-center gap-2 min-w-0">
						<CardTitle className="text-sm truncate">
							{scenario.id}
						</CardTitle>
						<Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
							{props.catLabel}
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge status={status} label={statusLabel} />
						<Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={props.onRun}>
							<Play className="w-3 h-3 mr-1" />
							{result ? props.rerunLabel : props.runLabel}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-4 pb-4 flex flex-col gap-3">
				<p className="text-xs text-muted-foreground">{props.labels.desc}</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
					<div className="bg-muted/30 rounded px-2 py-1.5">
						<div className="text-muted-foreground mb-0.5">{props.labels.initialTasks}</div>
						<div className="font-medium">{scenario.setup.initialTasks.length}</div>
					</div>
					<div className="bg-muted/30 rounded px-2 py-1.5">
						<div className="text-muted-foreground mb-0.5">{props.labels.contextTimeLabel}</div>
						<div className="font-medium">{formatContextTime(scenario.setup.contextTime)}</div>
					</div>
					<div className="bg-muted/30 rounded px-2 py-1.5 md:col-span-2">
						<div className="text-muted-foreground mb-0.5">{props.labels.createdTask}</div>
						<div className="font-medium">{formatTaskSummary(scenario.action.newlyCreatedTask)}</div>
					</div>
				</div>

				{result && (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							<div className="bg-muted/30 rounded px-2 py-1.5">
								<div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3" />
									{props.labels.expected}
								</div>
								<div className="text-[11px] leading-relaxed">{result.diff.expected}</div>
							</div>
							<div
								className={cn(
									"rounded px-2 py-1.5",
									status === "failed" ? "bg-red-500/5" : "bg-muted/30",
								)}
							>
								<div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
									<XCircle className="w-3 h-3" />
									{props.labels.actual}
								</div>
								<div className="text-[11px] leading-relaxed font-mono">
									{result.diff.actual}
								</div>
							</div>
						</div>

						{result.flagged.length > 0 && (
							<div className="bg-red-500/5 border border-red-500/20 rounded px-2 py-1.5">
								<div className="text-[10px] text-red-600 mb-1 flex items-center gap-1">
									<AlertTriangle className="w-3 h-3" />
									{props.labels.flaggedCount}: {result.flagged.length}
								</div>
								<div className="flex flex-col gap-1">
									{result.flagged.map((flagged, idx) => (
										<div key={idx} className="text-[11px] font-mono leading-relaxed">
											{formatRecommendation(flagged.recommendation.task.title,
												flagged.recommendation.task.date,
												flagged.recommendation.task.startTime,
												flagged.recommendation.confidence.toFixed(2))}
											<span className="text-muted-foreground">
												{" "}({props.labels.matchedCriteria}: {flagged.matchedCriteria.join(", ")})
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						{result.recommendationCount === 0 && (
							<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
								<Clock className="w-3 h-3" />
								{props.labels.noRecommendations}
							</div>
						)}

						{status === "failed" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								<div className="bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5">
									<div className="text-[10px] text-amber-600 mb-1 flex items-center gap-1">
										<AlertTriangle className="w-3 h-3" />
										{props.labels.anomalyAnalysis}
									</div>
									<div className="text-[11px] leading-relaxed">{props.labels.anomaly}</div>
								</div>
								<div className="bg-emerald-500/5 border border-emerald-500/20 rounded px-2 py-1.5">
									<div className="text-[10px] text-emerald-600 mb-1 flex items-center gap-1">
										<Lightbulb className="w-3 h-3" />
										{props.labels.optimizationSuggestion}
									</div>
									<div className="text-[11px] leading-relaxed">{props.labels.suggestion}</div>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

function StatusBadge({ status, label }: { status: TestResult["status"]; label: string }) {
	const cls =
		status === "passed"
			? "bg-emerald-500/10 text-emerald-600"
			: status === "failed"
				? "bg-red-500/10 text-red-600"
				: "bg-muted text-muted-foreground";
	return (
		<Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5", cls)}>
			{label}
		</Badge>
	);
}

function categoryLabel(cat: ScenarioCategory, dt: {
	catExact: string;
	catNear: string;
	catBehavior: string;
	catPeriodic: string;
	catBoundary: string;
}): string {
	switch (cat) {
		case "exact":
			return dt.catExact;
		case "near":
			return dt.catNear;
		case "behavior":
			return dt.catBehavior;
		case "periodic":
			return dt.catPeriodic;
		case "boundary":
			return dt.catBoundary;
	}
}

type ScenarioLabelMap = {
	readonly [key: string]: {
		readonly name: string;
		readonly desc: string;
		readonly anomaly: string;
		readonly suggestion: string;
	};
};

function scenarioLabel(id: string, labels: ScenarioLabelMap) {
	return labels[id];
}

function formatContextTime(iso: string | undefined): string {
	if (!iso) return "—";
	try {
		return format(parseISO(iso), "yyyy-MM-dd HH:mm");
	} catch {
		return iso;
	}
}

function formatTaskSummary(task: { title: string; date?: string; startTime?: string; endTime?: string; isAllDay: boolean }): string {
	const date = task.date ?? "—";
	if (task.isAllDay) {
		return `${task.title} · ${date} · all-day`;
	}
	const time = task.startTime && task.endTime ? `${task.startTime}-${task.endTime}` : "—";
	return `${task.title} · ${date} · ${time}`;
}

function formatRecommendation(title: string, date: string | undefined, startTime: string | undefined, confidence: string): string {
	return `→ ${title} @ ${date ?? "—"} ${startTime ?? "—"} (conf=${confidence})`;
}
