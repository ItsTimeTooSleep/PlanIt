"use client";

import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, ScrollText, Clock, CalendarClock, BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { calculateAccuracy } from "@/lib/smart-recommend/engine";
import type { DecisionLog, FeedbackRecord, SchedulingPattern } from "@/lib/smart-recommend/types";
import { DEFAULT_SCHEDULING_PATTERN } from "@/lib/smart-recommend/constants";

interface LogConsoleProps {
	logs: DecisionLog[];
	feedbacks: FeedbackRecord[];
	config?: unknown;
}

export function LogConsole({ logs, feedbacks }: LogConsoleProps) {
	const schedulingPatterns: SchedulingPattern = DEFAULT_SCHEDULING_PATTERN;
	const accuracy = useMemo(() => calculateAccuracy(feedbacks), [feedbacks]);
	const totalRecommendations = feedbacks.length;
	const accepted = feedbacks.filter((f) => f.accepted).length;
	const rejected = feedbacks.length - accepted;

	const accuracyHistory = useMemo(() => {
		if (feedbacks.length === 0) return [];
		const data: { index: number; accuracy: number }[] = [];
		let currentAccepted = 0;
		feedbacks.forEach((f, i) => {
			if (f.accepted) currentAccepted++;
			data.push({ index: i + 1, accuracy: Math.round((currentAccepted / (i + 1)) * 100) });
		});
		return data;
	}, [feedbacks]);

	const factorChartData = useMemo(() => {
		const factors = [
			{ key: "nameSimilarity", name: "名称语义" },
			{ key: "timePattern", name: "时间模式" },
			{ key: "tagCorrelation", name: "标签关联" },
			{ key: "durationStats", name: "时长统计" },
			{ key: "schedulingPattern", name: "调度模式" },
			{ key: "dueDatePattern", name: "截止日期" },
		];
		return factors.map((f) => ({
			name: f.name,
			accuracy: Math.round((accuracy.factorAccuracy[f.key] ?? 0) * 100),
			color: (accuracy.factorAccuracy[f.key] ?? 0) > 0.6 ? "#22c55e" : (accuracy.factorAccuracy[f.key] ?? 0) > 0.4 ? "#f59e0b" : "#ef4444",
		}));
	}, [accuracy]);

	const timeOfDayData = useMemo(() => {
		const prefs = schedulingPatterns.timeOfDayPreferences;
		if (!prefs || Object.keys(prefs).length === 0) return [];

		const hours = Object.keys(prefs).map(Number).sort((a, b) => a - b);
		return hours.map((hour) => {
			const durations = prefs[hour];
			const avgDuration = durations.length > 0
				? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
				: 0;
			const label = hour < 6 ? `${hour}时(凌晨)` : hour < 12 ? `${hour}时(上午)` : hour < 18 ? `${hour}时(下午)` : `${hour}时(晚上)`;
			return {
				hour: label,
				avgDuration,
				count: durations.length,
			};
		});
	}, [schedulingPatterns]);

	const tagDueDateData = useMemo(() => {
		const patterns = schedulingPatterns.tagDueDatePatterns;
		if (!patterns || Object.keys(patterns).length === 0) return [];

		return Object.entries(patterns).map(([tagId, pattern]) => ({
			tag: tagId.replace("tag-", ""),
			avgLeadDays: pattern.avgLeadDays,
			stdDevDays: pattern.stdDevDays,
		}));
	}, [schedulingPatterns]);

	const periodicData = useMemo(() => {
		const prefs = schedulingPatterns.periodicPreferences;
		if (!prefs || Object.keys(prefs).length === 0) return [];

		const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
		return Object.entries(prefs)
			.map(([key, value]) => {
				const dayNum = Number.parseInt(key.replace("dow-", ""));
				return {
					day: `周${dayNames[dayNum] ?? dayNum}`,
					ratio: Math.round(value * 100),
				};
			})
			.sort((a, b) => {
				const dayOrder = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
				return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
			});
	}, [schedulingPatterns]);

	const trendIcon = accuracy.trend === "improving" ? <TrendingUp className="w-3 h-3" /> : accuracy.trend === "declining" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />;
	const trendColor = accuracy.trend === "improving" ? "text-emerald-500" : accuracy.trend === "declining" ? "text-red-500" : "text-muted-foreground";
	const trendText = accuracy.trend === "improving" ? "提升中" : accuracy.trend === "declining" ? "下降中" : "稳定";

	const hasPatterns = schedulingPatterns.avgLeadTimeMinutes > 0 ||
		Object.keys(schedulingPatterns.timeOfDayPreferences).length > 0 ||
		Object.keys(schedulingPatterns.tagDueDatePatterns).length > 0 ||
		Object.keys(schedulingPatterns.periodicPreferences).length > 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-3 gap-3">
				<StatCard
					label="总推荐数"
					value={totalRecommendations}
					icon={<Activity className="w-3.5 h-3.5" />}
				/>
				<StatCard
					label="整体准确率"
					value={`${Math.round(accuracy.overall * 100)}%`}
					icon={<Check className="w-3.5 h-3.5 text-emerald-500" />}
					sub={`${accepted} 接受 / ${rejected} 拒绝`}
				/>
				<StatCard
					label="近期准确率"
					value={`${Math.round(accuracy.recent * 100)}%`}
					icon={<div className={trendColor}>{trendIcon}</div>}
					sub={trendText}
				/>
			</div>

			{accuracyHistory.length > 0 && (
				<Card>
					<CardHeader className="pb-2 pt-4 px-4">
						<CardTitle className="text-sm">准确率趋势</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						<ResponsiveContainer width="100%" height={140}>
							<LineChart data={accuracyHistory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
								<XAxis dataKey="index" tick={{ fontSize: 9 }} />
								<YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
								<Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v}%`, "准确率"]} />
								<Line type="monotone" dataKey="accuracy" stroke="var(--chart-primary)" strokeWidth={2} dot={false} />
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}

			{factorChartData.length > 0 && feedbacks.length > 0 && (
				<Card>
					<CardHeader className="pb-2 pt-4 px-4">
						<CardTitle className="text-sm">各因素区分度</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						<ResponsiveContainer width="100%" height={120}>
							<BarChart data={factorChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
								<XAxis dataKey="name" tick={{ fontSize: 9 }} />
								<YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
								<Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v}%`, "区分度"]} />
								<Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
									{factorChartData.map((entry, i) => (
										<Cell key={i} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}

			{hasPatterns && (
				<Card>
					<CardHeader className="pb-2 pt-4 px-4">
						<div className="flex items-center gap-2">
							<BarChart3 className="w-4 h-4 text-primary" />
							<CardTitle className="text-sm">调度模式分析</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						<div className="flex flex-col gap-4">
							{schedulingPatterns.avgLeadTimeMinutes > 0 && (
								<div className="bg-muted/50 rounded-lg p-3">
									<div className="flex items-center gap-2 mb-1">
										<Clock className="w-3.5 h-3.5 text-muted-foreground" />
										<span className="text-xs font-medium">平均提前量</span>
									</div>
									<p className="text-lg font-bold">
										{Math.floor(schedulingPatterns.avgLeadTimeMinutes / 60)}小时{schedulingPatterns.avgLeadTimeMinutes % 60}分钟
									</p>
									<p className="text-[10px] text-muted-foreground">从任务创建到执行的间隔</p>
								</div>
							)}

							{timeOfDayData.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-2">
										<Clock className="w-3.5 h-3.5 text-muted-foreground" />
										<span className="text-xs font-medium">各时段偏好时长</span>
									</div>
									<ResponsiveContainer width="100%" height={120}>
										<BarChart data={timeOfDayData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
											<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
											<XAxis dataKey="hour" tick={{ fontSize: 8 }} />
											<YAxis tick={{ fontSize: 9 }} />
											<Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v}分钟`, "平均时长"]} />
											<Bar dataKey="avgDuration" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							)}

							{periodicData.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-2">
										<CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
										<span className="text-xs font-medium">周期性偏好</span>
									</div>
									<ResponsiveContainer width="100%" height={100}>
										<BarChart data={periodicData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
											<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
											<XAxis dataKey="day" tick={{ fontSize: 9 }} />
											<YAxis tick={{ fontSize: 9 }} />
											<Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v}%`, "占比"]} />
											<Bar dataKey="ratio" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							)}

							{tagDueDateData.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-2">
										<CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
										<span className="text-xs font-medium">标签截止日期模式</span>
									</div>
									<div className="flex flex-col gap-1.5">
										{tagDueDateData.map((item) => (
											<div key={item.tag} className="flex items-center gap-2 bg-muted/30 rounded px-2.5 py-1.5">
												<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
													{item.tag}
												</Badge>
												<span className="text-xs flex-1">
													平均提前 <span className="font-semibold">{item.avgLeadDays}</span> 天
												</span>
												<span className="text-[10px] text-muted-foreground">
													σ = {item.stdDevDays}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{!hasPatterns && (
				<Card>
					<CardHeader className="pb-2 pt-4 px-4">
						<div className="flex items-center gap-2">
							<BarChart3 className="w-4 h-4 text-muted-foreground" />
							<CardTitle className="text-sm text-muted-foreground">调度模式分析</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4">
						<div className="flex flex-col items-center py-6 text-center">
							<BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-2" />
							<p className="text-xs text-muted-foreground">暂无调度模式数据</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">添加更多任务后将自动分析调度习惯</p>
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm">决策日志</CardTitle>
						<Badge variant="secondary" className="text-[10px]">{logs.length} 条</Badge>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					{logs.length === 0 ? (
						<div className="flex flex-col items-center py-8 text-center">
							<ScrollText className="w-8 h-8 text-muted-foreground/30 mb-2" />
							<p className="text-xs text-muted-foreground">暂无决策日志</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">生成推荐后日志将自动记录</p>
						</div>
					) : (
						<div className="max-h-64 overflow-y-auto flex flex-col gap-2">
							{logs.slice().reverse().slice(0, 20).map((log) => (
								<DecisionLogEntry key={log.id} log={log} />
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm">交互历史</CardTitle>
						<Badge variant="secondary" className="text-[10px]">{feedbacks.length} 条</Badge>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					{feedbacks.length === 0 ? (
						<div className="flex flex-col items-center py-8 text-center">
							<AlertTriangle className="w-8 h-8 text-muted-foreground/30 mb-2" />
							<p className="text-xs text-muted-foreground">暂无交互记录</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">接受或拒绝推荐后将记录反馈</p>
						</div>
					) : (
						<div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
							{feedbacks.slice().reverse().slice(0, 30).map((fb) => (
								<div key={fb.id} className={cn(
									"flex items-center gap-2 rounded px-2 py-1.5 text-xs",
									fb.accepted ? "bg-emerald-500/10" : "bg-red-500/10",
								)}>
									{fb.accepted ? (
										<Check className="w-3 h-3 text-emerald-500 shrink-0" />
									) : (
										<AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
									)}
									<span className="flex-1 truncate">{fb.taskTitle}</span>
									<span className="text-[10px] text-muted-foreground shrink-0">
										{format(new Date(fb.timestamp), "HH:mm:ss")}
									</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) {
	return (
		<div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1">
			<div className="flex items-center gap-1.5">
				{icon}
				<p className="text-[10px] text-muted-foreground">{label}</p>
			</div>
			<p className="text-lg font-bold leading-none">{value}</p>
			{sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
		</div>
	);
}

function DecisionLogEntry({ log }: { log: DecisionLog }) {
	const recommendations = Array.isArray(log.recommendations) ? log.recommendations : [];
	const factorDetails = Array.isArray(log.factorDetails) ? log.factorDetails : [];

	return (
		<div className="bg-muted/30 rounded-lg p-2.5">
			<div className="flex items-center justify-between mb-1.5">
				<span className="text-[10px] text-muted-foreground">{log.contextTime}</span>
				<Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
					{recommendations.length} 条推荐
				</Badge>
			</div>
			<div className="flex flex-col gap-1">
				{factorDetails.map((detail, i) => (
					<div key={i} className="flex items-center gap-1.5 text-[10px]">
						<span className="text-muted-foreground w-14 shrink-0">{detail.factor}</span>
						<div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
							<div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.round(detail.weight * 100)}%` }} />
						</div>
						<span className="text-muted-foreground w-8 text-right">{(detail.weight * 100).toFixed(0)}%</span>
						<span className="w-10 text-right">{detail.rawScore.toFixed(2)}</span>
					</div>
				))}
			</div>
			{recommendations.length > 0 && (
				<div className="mt-1.5 pt-1.5 border-t border-border/50">
					<p className="text-[10px] text-muted-foreground">
						Top 1: <span className="text-foreground font-medium">{recommendations[0].task.title}</span>
						<span className="ml-1">({(recommendations[0].scores.total * 100).toFixed(1)}%)</span>
					</p>
				</div>
			)}
		</div>
	);
}
