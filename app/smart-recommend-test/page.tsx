"use client";

import { format, addDays, differenceInMinutes } from "date-fns";
import { ArrowLeft, Brain, FlaskConical, ScrollText, Plus, TrendingUp, Calendar, AlertTriangle, Download, Upload, Bug } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useRef, useDeferredValue } from "react";
import { AnimatedTabsList, AnimatedTabsTrigger, Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { analyzeSchedulingPatterns, generateRecommendations, calculateAccuracy, generateBatchTasks } from "@/lib/smart-recommend/engine";
import { loadState, saveState, resetState } from "@/lib/smart-recommend/store";
import { SelfLearningMechanism } from "@/lib/smart-recommend/evaluation";
import type { AlgorithmConfig, DecisionLog, FeedbackRecord, RecommendTag, RecommendTask, SchedulingPattern, SmartRecommendState, Recommendation, AnalysisMetadata } from "@/lib/smart-recommend/types";
import { DEFAULT_CONFIG, DEFAULT_SCHEDULING_PATTERN, PRESET_TAGS } from "@/lib/smart-recommend/constants";
import { LogConsole } from "@/components/smart-recommend/log-console";
import { RecommendPanel } from "@/components/smart-recommend/recommend-panel";
import { TestPanel } from "@/components/smart-recommend/test-panel";
import { SmartRecommendTaskModal } from "@/components/smart-recommend/smart-recommend-task-modal";
import { RecommendDetailPanel } from "@/components/smart-recommend/recommend-detail-panel";
import { DuplicatePredictionTest } from "@/components/smart-recommend/duplicate-prediction-test";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { generateId } from "@/lib/task-utils";
import type { ExportData, Task, Tag } from "@/lib/types";

export default function SmartRecommendTestPage() {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [tasks, setTasks] = useState<RecommendTask[]>([]);
	const [tags, setTags] = useState<RecommendTag[]>(PRESET_TAGS);
	const [config, setConfig] = useState<AlgorithmConfig>(DEFAULT_CONFIG);
	const [logs, setLogs] = useState<DecisionLog[]>([]);
	const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
	const [schedulingPatterns, setSchedulingPatterns] = useState<SchedulingPattern>(DEFAULT_SCHEDULING_PATTERN);
	const [contextTime, setContextTime] = useState<Date>(() => new Date());
	const [customCreatedAt, setCustomCreatedAt] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("recommend");
	const [hydrated, setHydrated] = useState(false);

	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
	const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

	// 导入导出相关状态
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [importMode, setImportMode] = useState<"merge" | "overwrite">("merge");
	const [pendingImportData, setPendingImportData] = useState<SmartRecommendState | null>(null);
	const [importFileInfo, setImportFileInfo] = useState<{ version: number; date: string } | null>(null);

	// 使用 ref 来跟踪是否已经完成初始化加载，避免在加载完成前保存空状态
	const isInitializedRef = useRef(false);

	// 用于防抖保存的 ref
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const state = loadState();
		setTasks(state.tasks);
		setTags(state.tags);
		setConfig(state.config);
		setLogs(state.logs);
		setFeedbacks(state.feedbacks);
		setSchedulingPatterns(state.schedulingPatterns);
		setCustomCreatedAt(state.customCreatedAt);
		if (state.customCreatedAt) {
			try {
				setContextTime(new Date(state.customCreatedAt));
			} catch {
				// invalid date, use current
			}
		}
		// 标记初始化完成，并设置 hydrated
		isInitializedRef.current = true;
		setHydrated(true);
	}, []);

	useEffect(() => {
		// 只有在初始化完成后才保存状态，避免用空状态覆盖 localStorage
		if (!hydrated || !isInitializedRef.current) return;

		// 使用防抖延迟保存，避免频繁写入 localStorage
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		saveTimeoutRef.current = setTimeout(() => {
			const state: SmartRecommendState = {
				tasks,
				tags,
				config,
				logs,
				feedbacks,
				schedulingPatterns,
				customCreatedAt,
			};
			saveState(state);
		}, 500); // 500ms 防抖延迟

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [tasks, tags, config, logs, feedbacks, schedulingPatterns, customCreatedAt, hydrated]);

	useEffect(() => {
		if (tasks.length > 0) {
			const patterns = analyzeSchedulingPatterns(tasks);
			setSchedulingPatterns(patterns);
		}
	}, [tasks]);

	// 使用延迟版本的 config，避免参数调整时频繁重新计算推荐
	const deferredConfig = useDeferredValue(config);

	const { recommendations, currentLog, analysisMetadata } = useMemo(() => {
		const result = generateRecommendations(tasks, tags, deferredConfig, contextTime);
		return {
			recommendations: result.recommendations,
			currentLog: result.log,
			analysisMetadata: result.analysisMetadata,
		};
	}, [tasks, tags, deferredConfig, contextTime]);

	const handleAccept = useCallback((index: number) => {
			const rec = recommendations[index];
			if (!rec) return;
			const newTask = { 
				...rec.task, 
				id: generateId(), 
				createdAt: contextTime.toISOString() 
			};
			setTasks((prev) => [...prev, newTask]);
			setLogs((prev) => [currentLog, ...prev].slice(0, 100));
			const feedback: FeedbackRecord = {
				id: generateId(),
				recommendationId: rec.task.id,
				taskTitle: rec.task.title,
				accepted: true,
				timestamp: new Date().toISOString(),
				contextTime: contextTime.toISOString(),
				scores: rec.scores,
				task: newTask,
			};
			setFeedbacks((prev) => [...prev, feedback].slice(0, 1000));

			if (config.autoLearning) {
				const learner = new SelfLearningMechanism(config);
				const newConfig = learner.updateFromFeedback(feedback);
				setConfig(newConfig);
			}
		}, [recommendations, currentLog, contextTime, config]);

		const handleReject = useCallback((index: number) => {
			const rec = recommendations[index];
			if (!rec) return;
			setLogs((prev) => [currentLog, ...prev].slice(0, 100));
			const feedback: FeedbackRecord = {
				id: generateId(),
				recommendationId: rec.task.id,
				taskTitle: rec.task.title,
				accepted: false,
				timestamp: new Date().toISOString(),
				contextTime: new Date().toISOString(),
				scores: rec.scores,
				task: rec.task,
			};
			setFeedbacks((prev) => [...prev, feedback].slice(0, 1000));

			if (config.autoLearning) {
				const learner = new SelfLearningMechanism(config);
				const newConfig = learner.updateFromFeedback(feedback);
				setConfig(newConfig);
			}
		}, [recommendations, currentLog, config]);

	const handleCreateTask = useCallback((task: RecommendTask) => {
		setTasks((prev) => [...prev, task]);
		setLogs((prev) => [currentLog, ...prev].slice(0, 100));
		setIsTaskModalOpen(false);
	}, [currentLog]);

	const handleDeleteTask = useCallback((id: string) => {
		setTasks((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleClearTasks = useCallback(() => {
		const state = resetState();
		setTasks(state.tasks);
		setConfig(state.config);
		setLogs(state.logs);
		setFeedbacks(state.feedbacks);
		setSchedulingPatterns(state.schedulingPatterns);
		setCustomCreatedAt(state.customCreatedAt);
	}, []);

	// 导出调试数据（用于分析推荐算法）
	const handleExportDebugData = useCallback(() => {
		const debugData = {
			exportDate: new Date().toISOString(),
			context: {
				contextTime: contextTime.toISOString(),
				timeOfDay: (() => {
					const hour = contextTime.getHours();
					if (hour >= 12 && hour < 17) return 'afternoon';
					if (hour >= 17 && hour < 21) return 'evening';
					if (hour >= 21 || hour < 6) return 'night';
					return 'morning';
				})(),
				dayType: (() => {
					const dow = contextTime.getDay();
					return (dow === 0 || dow === 6) ? 'weekend' : 'workday';
				})(),
				currentHour: contextTime.getHours(),
				currentDayOfWeek: contextTime.getDay(),
			},
			config: {
				weights: config.weights,
				maxRecommendations: config.maxRecommendations,
				minConfidence: config.minConfidence,
				diversityLambda: config.diversityLambda,
				autoLearning: config.autoLearning,
				learningRate: config.learningRate,
			},
			rawTasks: tasks.map(t => ({
				id: t.id,
				title: t.title,
				date: t.date,
				startTime: t.startTime,
				endTime: t.endTime,
				isAllDay: t.isAllDay,
				tagIds: t.tagIds,
				duration: t.duration,
				createdAt: t.createdAt,
				dueDate: t.dueDate,
				status: t.status,
			})),
			tags: tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
			recommendations: recommendations.map(r => ({
				taskTitle: r.task.title,
				taskDate: r.task.date,
				taskStartTime: r.task.startTime,
				taskEndTime: r.task.endTime,
				taskTagIds: r.task.tagIds,
				taskDuration: r.task.duration,
				confidence: r.confidence,
				reason: r.reason,
				recommendationType: r.recommendationType,
				scores: {
					nameSimilarity: r.scores.nameSimilarity,
					timePattern: r.scores.timePattern,
					tagCorrelation: r.scores.tagCorrelation,
					durationStats: r.scores.durationStats,
					timeRelation: r.scores.timeRelation,
					periodicPattern: r.scores.periodicPattern,
					contextMatch: r.scores.contextMatch,
					sequenceMatch: r.scores.sequenceMatch,
					total: r.scores.total,
				},
				scoreBreakdown: Object.entries(config.weights).map(([key, weight]) => ({
					factor: key,
					rawScore: r.scores[key as keyof typeof r.scores],
					weight,
					weightedScore: r.scores[key as keyof typeof r.scores] * weight,
				})),
			})),
			analysisMetadata: analysisMetadata ? {
				periodicPatterns: analysisMetadata.periodicPatterns?.map((p: {
				titlePattern: string;
				frequency: string;
				occurrences: number;
				confidence: number;
				dayOfWeek?: number;
				timeOfDay?: string;
			}) => ({
				titlePattern: p.titlePattern,
				frequency: p.frequency,
				occurrences: p.occurrences,
				confidence: p.confidence,
				dayOfWeek: p.dayOfWeek,
				timeOfDay: p.timeOfDay,
			})) || [],
			taskSequences: analysisMetadata.behaviorPatterns?.taskSequences?.map((s: {
				sequence: string[];
				frequency: number;
			}) => ({
				sequence: s.sequence,
				frequency: s.frequency,
			})) || [],
			} : null,
			statistics: {
				totalTasks: tasks.length,
				uniqueTitles: new Set(tasks.map(t => t.title.toLowerCase().trim())).size,
				tasksByTitle: Object.entries(tasks.reduce((acc, t) => {
					const normalized = t.title.toLowerCase().trim();
					acc[normalized] = (acc[normalized] || 0) + 1;
					return acc;
				}, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]),
				tasksByTag: Object.entries(tasks.reduce((acc, t) => {
					for (const tagId of t.tagIds) {
						acc[tagId] = (acc[tagId] || 0) + 1;
					}
					return acc;
				}, {} as Record<string, number>)),
			},
		};

		const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `smart-recommend-debug-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [tasks, tags, config, recommendations, analysisMetadata, contextTime]);

	// 导出数据
	const handleExportData = useCallback(() => {
		if (tasks.length === 0 && feedbacks.length === 0 && logs.length === 0) {
			alert(t.smartRecommendTest.noDataToExport);
			return;
		}
		const state: SmartRecommendState = {
			tasks,
			tags,
			config,
			logs,
			feedbacks,
			schedulingPatterns,
			customCreatedAt,
		};
		const exportData = {
			version: 1,
			exportDate: new Date().toISOString(),
			data: state,
		};
		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `smart-recommend-data-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		alert(t.smartRecommendTest.exportSuccess);
	}, [tasks, tags, config, logs, feedbacks, schedulingPatterns, customCreatedAt, t]);

	// 导入数据文件选择
	const handleImportFileSelect = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const raw = event.target?.result as string;
					const parsed = JSON.parse(raw);
					
					// 检查是否是设置页面导出的 ExportData 格式
					if ("meta" in parsed && "data" in parsed) {
						const exportData = parsed as ExportData;
						// 将 Task[] 转换为 RecommendTask[]
						const convertedTasks: RecommendTask[] = exportData.data.tasks.map((task: Task) => {
							// 计算 duration
							let duration = 60; // 默认 1 小时
							if (task.startTime && task.endTime) {
								const start = new Date(`2000-01-01 ${task.startTime}`);
								const end = new Date(`2000-01-01 ${task.endTime}`);
								duration = differenceInMinutes(end, start) || 60;
							}
							return {
								id: task.id,
								title: task.title,
								date: task.date,
								startTime: task.startTime,
								endTime: task.endTime,
								isAllDay: task.isAllDay,
								tagIds: task.tagIds,
								duration,
								createdAt: task.createdAt,
								dueDate: task.dueDate,
								notes: task.notes,
								status: task.status,
							};
						});
						// 将 Tag[] 转换为 RecommendTag[]
						const convertedTags: RecommendTag[] = exportData.data.tags.map((tag: Tag) => ({
							id: tag.id,
							name: tag.name,
							color: tag.color,
						}));
						
						setPendingImportData({
							tasks: convertedTasks,
							tags: convertedTags.length > 0 ? convertedTags : PRESET_TAGS,
							config: DEFAULT_CONFIG,
							logs: [],
							feedbacks: [],
							schedulingPatterns: DEFAULT_SCHEDULING_PATTERN,
							customCreatedAt: null,
						});
						setImportFileInfo({
							version: parseInt(exportData.meta.version) || 1,
							date: exportData.meta.exportDate,
						});
						setIsImportDialogOpen(true);
					} else if ("tasks" in parsed && !parsed.data) {
						// 旧格式或智能推荐测试页面导出的格式
						setPendingImportData(parsed as SmartRecommendState);
						setImportFileInfo({
							version: parsed.version || 1,
							date: parsed.exportDate || new Date().toISOString(),
						});
						setIsImportDialogOpen(true);
					} else {
						alert(t.smartRecommendTest.importError);
					}
				} catch {
					alert(t.smartRecommendTest.importError);
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}, [t]);

	// 确认导入
	const handleConfirmImport = useCallback(() => {
		if (!pendingImportData) return;
		if (importMode === "overwrite") {
			setTasks(pendingImportData.tasks);
			setTags(pendingImportData.tags);
			setConfig(pendingImportData.config);
			setLogs(pendingImportData.logs);
			setFeedbacks(pendingImportData.feedbacks);
			setSchedulingPatterns(pendingImportData.schedulingPatterns);
			setCustomCreatedAt(pendingImportData.customCreatedAt);
		} else {
			// 合并模式
			setTasks((prev) => [...prev, ...pendingImportData.tasks]);
			setLogs((prev) => [...prev, ...pendingImportData.logs].slice(0, 100));
			setFeedbacks((prev) => [...prev, ...pendingImportData.feedbacks].slice(0, 1000));
			// 配置和标签保留现有值
		}
		saveState({
			tasks: importMode === "overwrite" ? pendingImportData.tasks : [...tasks, ...pendingImportData.tasks],
			tags: importMode === "overwrite" ? pendingImportData.tags : tags,
			config: importMode === "overwrite" ? pendingImportData.config : config,
			logs: importMode === "overwrite" ? pendingImportData.logs : [...logs, ...pendingImportData.logs].slice(0, 100),
			feedbacks: importMode === "overwrite" ? pendingImportData.feedbacks : [...feedbacks, ...pendingImportData.feedbacks].slice(0, 1000),
			schedulingPatterns: importMode === "overwrite" ? pendingImportData.schedulingPatterns : schedulingPatterns,
			customCreatedAt: importMode === "overwrite" ? pendingImportData.customCreatedAt : customCreatedAt,
		});
		setIsImportDialogOpen(false);
		setPendingImportData(null);
		setImportFileInfo(null);
		alert(t.smartRecommendTest.importSuccess);
	}, [pendingImportData, importMode, tasks, tags, config, logs, feedbacks, schedulingPatterns, customCreatedAt, t]);

	const handleViewDetail = useCallback((rec: Recommendation) => {
		setSelectedRecommendation(rec);
		setIsDetailPanelOpen(true);
	}, []);

	const handleGenerateBatchTasks = useCallback(() => {
		const batchTasks = generateBatchTasks(5, tasks);
		setTasks((prev) => [...prev, ...batchTasks]);
	}, [tasks]);

	const handleShowDetailFromModal = useCallback((rec: Recommendation) => {
		setSelectedRecommendation(rec);
		setIsDetailPanelOpen(true);
	}, []);

	const stats = useMemo(() => {
		const accuracyStats = calculateAccuracy(feedbacks);
		const avgConfidence = recommendations.length > 0
			? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
			: 0;

		const novelCount = recommendations.filter(r => r.isNovel).length;
		const noveltyRate = recommendations.length > 0 ? novelCount / recommendations.length : 0;

		return {
			...accuracyStats,
			avgConfidence,
			noveltyRate
		};
	}, [feedbacks, recommendations]);

	return (
		<div className="h-screen overflow-hidden flex flex-col bg-background">
			<header className="border-b border-border px-6 py-4 shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link href="/">
							<Button variant="ghost" size="icon">
								<ArrowLeft className="w-5 h-5" />
							</Button>
						</Link>
						<div>
							<h1 className="text-xl font-semibold flex items-center gap-2">
								<Brain className="w-5 h-5 text-primary" />
								{t.smartRecommendTest.title}
							</h1>
							<p className="text-sm text-muted-foreground">
								{t.smartRecommendTest.description}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={() => setIsTaskModalOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							{t.smartRecommendTest.createTask}
						</Button>
						<Button variant="outline" onClick={handleExportDebugData} title="导出调试数据用于分析推荐算法">
							<Bug className="w-4 h-4 mr-2" />
							调试导出
						</Button>
						<Button variant="outline" onClick={handleExportData} title={t.smartRecommendTest.exportDataDesc}>
							<Download className="w-4 h-4 mr-2" />
							{t.smartRecommendTest.exportData}
						</Button>
						<Button variant="outline" onClick={handleImportFileSelect} title={t.smartRecommendTest.importDataDesc}>
							<Upload className="w-4 h-4 mr-2" />
							{t.smartRecommendTest.importData}
						</Button>
						<Button variant="secondary" onClick={handleClearTasks}>
							{t.smartRecommendTest.resetData}
						</Button>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 max-w-7xl flex-1 overflow-y-auto">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<TrendingUp className="w-4 h-4" />
								{t.smartRecommendTest.acceptRate}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{(stats.accuracy * 100).toFixed(1)}%</div>
							<div className="text-xs text-muted-foreground">{stats.accepted}/{stats.totalRecommendations} {t.smartRecommendTest.importSuccess}</div>
						</CardContent>
					</Card>

					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Brain className="w-4 h-4" />
								{t.smartRecommendTest.avgConfidence}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</div>
							<div className="text-xs text-muted-foreground">{recommendations.length} {t.smartRecommendTest.tabRecommend}</div>
						</CardContent>
					</Card>

					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<FlaskConical className="w-4 h-4" />
								{t.smartRecommendTest.noveltyRate}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{(stats.noveltyRate * 100).toFixed(1)}%</div>
							<div className="text-xs text-muted-foreground">{recommendations.filter(r => r.isNovel).length}</div>
						</CardContent>
					</Card>

					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								{t.smartRecommendTest.historicalTasks}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{tasks.length}</div>
							<div className="text-xs text-muted-foreground">{t.smartRecommendTest.forPatternLearning}</div>
						</CardContent>
					</Card>
				</div>

				{analysisMetadata && (
					<Card className="mb-8">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Brain className="w-4 h-4" />
								{t.smartRecommendTest.analysisOverview}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<div className="text-sm font-medium">{t.smartRecommendTest.timeRelationPatterns}</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.timeRelationPatterns?.length || 0)}
									</div>
								</div>
								<div>
									<div className="text-sm font-medium">{t.smartRecommendTest.periodicPatterns}</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.periodicPatterns?.length || 0)}
									</div>
								</div>
								<div>
									<div className="text-sm font-medium">{t.smartRecommendTest.predictedTasks}</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.predictedTasks?.length || 0)}
									</div>
								</div>
								<div>
									<div className="text-sm font-medium">{t.smartRecommendTest.dynamicRules}</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.dynamicRules?.length || 0)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				<Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
					<AnimatedTabsList>
						<AnimatedTabsTrigger value="recommend" className="flex items-center gap-2">
							<Brain className="w-4 h-4" />
							{t.smartRecommendTest.tabRecommend}
						</AnimatedTabsTrigger>
						<AnimatedTabsTrigger value="test" className="flex items-center gap-2">
							<FlaskConical className="w-4 h-4" />
							{t.smartRecommendTest.tabTest}
						</AnimatedTabsTrigger>
						<AnimatedTabsTrigger value="logs" className="flex items-center gap-2">
							<ScrollText className="w-4 h-4" />
							{t.smartRecommendTest.tabLogs}
						</AnimatedTabsTrigger>
						<AnimatedTabsTrigger value="duplicate-test" className="flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							{t.duplicateTest.title}
						</AnimatedTabsTrigger>
					</AnimatedTabsList>
				</Tabs>

				{activeTab === "recommend" && (
					<RecommendPanel
						recommendations={recommendations}
						tags={tags}
						onAccept={handleAccept}
						onReject={handleReject}
						contextTime={contextTime}
						onContextTimeChange={setContextTime}
						onViewDetail={handleViewDetail}
						onOpenTaskModal={() => setIsTaskModalOpen(true)}
					/>
				)}

				{activeTab === "test" && (
					<TestPanel
						tasks={tasks}
						tags={tags}
						config={config}
						contextTime={contextTime}
						customCreatedAt={customCreatedAt}
						onConfigChange={setConfig}
						onContextTimeChange={setContextTime}
						onCustomCreatedAtChange={setCustomCreatedAt}
						onDeleteTask={handleDeleteTask}
						onGenerateBatchTasks={handleGenerateBatchTasks}
						onTagsChange={setTags}
					/>
				)}

				{activeTab === "logs" && (
					<LogConsole
						logs={logs}
						feedbacks={feedbacks}
						config={config}
					/>
				)}

				{activeTab === "duplicate-test" && (
					<DuplicatePredictionTest tags={tags} />
				)}
			</main>

			<SmartRecommendTaskModal
				open={isTaskModalOpen}
				onClose={() => setIsTaskModalOpen(false)}
				tags={tags}
				recommendations={recommendations}
				onSubmit={handleCreateTask}
				onShowDetail={handleShowDetailFromModal}
				defaultCreatedAt={format(contextTime, "yyyy-MM-dd'T'HH:mm")}
				defaultDate={format(contextTime, "yyyy-MM-dd")}
				defaultStartTime={format(contextTime, "HH:mm")}
				defaultEndTime={format(addDays(contextTime, 0.0417), "HH:mm")} // 默认1小时后结束
				defaultDueDate={format(addDays(contextTime, 1), "yyyy-MM-dd")}
			/>

			<RecommendDetailPanel
				open={isDetailPanelOpen}
				onClose={() => setIsDetailPanelOpen(false)}
				recommendation={selectedRecommendation}
				tags={tags}
				weights={config.weights}
			/>

			{/* 导入数据对话框 */}
			<Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t.smartRecommendTest.importData}</DialogTitle>
						<DialogDescription>
							{t.smartRecommendTest.selectImportMode}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{importFileInfo && (
							<div className="text-sm text-muted-foreground space-y-1">
								<div>{t.smartRecommendTest.importFileVersion}: {importFileInfo.version}</div>
								<div>{t.smartRecommendTest.importFileDate}: {format(new Date(importFileInfo.date), "yyyy-MM-dd HH:mm")}</div>
							</div>
						)}
						{pendingImportData && (
							<div className="text-sm space-y-1">
								<div className="font-medium">{t.smartRecommendTest.importItems}:</div>
								<div>{t.smartRecommendTest.importTasksCount(pendingImportData.tasks.length)}</div>
								<div>{t.smartRecommendTest.importFeedbacksCount(pendingImportData.feedbacks.length)}</div>
								<div>{t.smartRecommendTest.importLogsCount(pendingImportData.logs.length)}</div>
							</div>
						)}
						<RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as "merge" | "overwrite")}>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="merge" id="merge" />
								<Label htmlFor="merge" className="cursor-pointer">
									<div className="font-medium">{t.smartRecommendTest.importMerge}</div>
									<div className="text-sm text-muted-foreground">{t.smartRecommendTest.importMergeDesc}</div>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="overwrite" id="overwrite" />
								<Label htmlFor="overwrite" className="cursor-pointer">
									<div className="font-medium">{t.smartRecommendTest.importOverwrite}</div>
									<div className="text-sm text-muted-foreground">{t.smartRecommendTest.importOverwriteDesc}</div>
								</Label>
							</div>
						</RadioGroup>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
							{t.common.cancel}
						</Button>
						<Button onClick={handleConfirmImport}>
							{t.smartRecommendTest.importConfirm}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
