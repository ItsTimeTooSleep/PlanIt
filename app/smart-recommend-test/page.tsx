"use client";

import { format } from "date-fns";
import { ArrowLeft, Brain, FlaskConical, ScrollText, Plus, TrendingUp, Calendar, Clock, Sparkles, Check, X, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedTabsList, AnimatedTabsTrigger, Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeSchedulingPatterns, generateRecommendations, calculateAccuracy, generateBatchTasks } from "@/lib/smart-recommend/engine";
import { loadState, saveState, resetState } from "@/lib/smart-recommend/store";
import type { AlgorithmConfig, DecisionLog, FeedbackRecord, RecommendTag, RecommendTask, SchedulingPattern, SmartRecommendState, Recommendation, AnalysisMetadata } from "@/lib/smart-recommend/types";
import { DEFAULT_CONFIG, DEFAULT_SCHEDULING_PATTERN, PRESET_TAGS } from "@/lib/smart-recommend/constants";
import { LogConsole } from "@/components/smart-recommend/log-console";
import { RecommendPanel } from "@/components/smart-recommend/recommend-panel";
import { TestPanel } from "@/components/smart-recommend/test-panel";
import { SmartRecommendTaskModal } from "@/components/smart-recommend/smart-recommend-task-modal";
import { RecommendDetailPanel } from "@/components/smart-recommend/recommend-detail-panel";
import { generateId } from "@/lib/task-utils";

export default function SmartRecommendTestPage() {
	const [tasks, setTasks] = useState<RecommendTask[]>([]);
	const [tags] = useState<RecommendTag[]>(PRESET_TAGS);
	const [config, setConfig] = useState<AlgorithmConfig>(DEFAULT_CONFIG);
	const [logs, setLogs] = useState<DecisionLog[]>([]);
	const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
	const [schedulingPatterns, setSchedulingPatterns] = useState<SchedulingPattern>(DEFAULT_SCHEDULING_PATTERN);
	const [contextTime, setContextTime] = useState<Date>(() => new Date());
	const [customCreatedAt, setCustomCreatedAt] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("recommend");
	const [hydrated, setHydrated] = useState(false);
	const [analysisMetadata, setAnalysisMetadata] = useState<AnalysisMetadata | null>(null);

	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
	const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

	useEffect(() => {
		const state = loadState();
		setTasks(state.tasks);
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
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (!hydrated) return;
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
	}, [tasks, tags, config, logs, feedbacks, schedulingPatterns, customCreatedAt, hydrated]);

	useEffect(() => {
		if (tasks.length > 0) {
			const patterns = analyzeSchedulingPatterns(tasks);
			setSchedulingPatterns(patterns);
		}
	}, [tasks]);

	const effectiveCreatedAt = useMemo(() => {
		if (customCreatedAt) {
			try {
				return new Date(customCreatedAt);
			} catch {
				return new Date();
			}
		}
		return new Date();
	}, [customCreatedAt]);

	const { recommendations, currentLog } = useMemo(() => {
		const result = generateRecommendations(tasks, tags, config, contextTime);
		setAnalysisMetadata(result.analysisMetadata);
		return { recommendations: result.recommendations, currentLog: result.log };
	}, [tasks, tags, config, contextTime]);

	const handleAccept = useCallback((index: number) => {
		const rec = recommendations[index];
		if (!rec) return;
		setTasks((prev) => [...prev, { ...rec.task, id: generateId() }]);
		setLogs((prev) => [currentLog, ...prev].slice(0, 100));
		setFeedbacks((prev) => [
			...prev,
			{
				id: generateId(),
				recommendationId: rec.task.id,
				taskTitle: rec.task.title,
				accepted: true,
				timestamp: new Date().toISOString(),
				contextTime: new Date().toISOString(),
				scores: rec.scores,
				task: rec.task,
			},
		].slice(0, 1000));
	}, [recommendations, currentLog]);

	const handleReject = useCallback((index: number) => {
		const rec = recommendations[index];
		if (!rec) return;
		setLogs((prev) => [currentLog, ...prev].slice(0, 100));
		setFeedbacks((prev) => [
			...prev,
			{
				id: generateId(),
				recommendationId: rec.task.id,
				taskTitle: rec.task.title,
				accepted: false,
				timestamp: new Date().toISOString(),
				contextTime: new Date().toISOString(),
				scores: rec.scores,
				task: rec.task,
			},
		].slice(0, 1000));
	}, [recommendations, currentLog]);

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

	const handleViewDetail = useCallback((rec: Recommendation) => {
		setSelectedRecommendation(rec);
		setIsDetailPanelOpen(true);
	}, []);

	const handleGenerateBatchTasks = useCallback(() => {
		const batchTasks = generateBatchTasks(5);
		setTasks((prev) => [...prev, ...batchTasks]);
	}, []);

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
								智能推荐测试
							</h1>
							<p className="text-sm text-muted-foreground">
								优化的混合推荐算法 - 包含近期重复任务降权
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={() => setIsTaskModalOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							创建任务
						</Button>
						<Button variant="secondary" onClick={handleClearTasks}>
							重置数据
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
								接受率
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{(stats.accuracy * 100).toFixed(1)}%</div>
							<div className="text-xs text-muted-foreground">{stats.accepted}/{stats.totalRecommendations} 已接受</div>
						</CardContent>
					</Card>

					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Brain className="w-4 h-4" />
								平均置信度
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</div>
							<div className="text-xs text-muted-foreground">基于 {recommendations.length} 个推荐</div>
						</CardContent>
					</Card>

					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<FlaskConical className="w-4 h-4" />
								探索性推荐占比
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{(stats.noveltyRate * 100).toFixed(1)}%</div>
							<div className="text-xs text-muted-foreground">{recommendations.filter(r => r.isNovel).length} 个新推荐</div>
						</CardContent>
					</Card>

					<Card className="col-span-1">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								历史任务数
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{tasks.length}</div>
							<div className="text-xs text-muted-foreground">用于模式学习</div>
						</CardContent>
					</Card>
				</div>

				{analysisMetadata && (
					<Card className="mb-8">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Brain className="w-4 h-4" />
								智能分析概览
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<div className="text-sm font-medium">时间关系模式</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.timeRelationPatterns?.length || 0)}
									</div>
								</div>
								<div>
									<div className="text-sm font-medium">周期性模式</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.periodicPatterns?.length || 0)}
									</div>
								</div>
								<div>
									<div className="text-sm font-medium">预测任务</div>
									<div className="text-lg font-bold">
										{(analysisMetadata.predictedTasks?.length || 0)}
									</div>
								</div>
								<div>
									<div className="text-sm font-medium">动态规则</div>
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
							推荐结果
						</AnimatedTabsTrigger>
						<AnimatedTabsTrigger value="test" className="flex items-center gap-2">
							<FlaskConical className="w-4 h-4" />
							参数测试
						</AnimatedTabsTrigger>
						<AnimatedTabsTrigger value="logs" className="flex items-center gap-2">
							<ScrollText className="w-4 h-4" />
							日志记录
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
						config={config}
						contextTime={contextTime}
						customCreatedAt={customCreatedAt}
						onConfigChange={setConfig}
						onContextTimeChange={setContextTime}
						onCustomCreatedAtChange={setCustomCreatedAt}
						onDeleteTask={handleDeleteTask}
						onGenerateBatchTasks={handleGenerateBatchTasks}
					/>
				)}

				{activeTab === "logs" && (
					<LogConsole
						logs={logs}
						feedbacks={feedbacks}
						config={config}
					/>
				)}
			</main>

			<SmartRecommendTaskModal
				open={isTaskModalOpen}
				onClose={() => setIsTaskModalOpen(false)}
				tags={tags}
				recommendations={recommendations}
				onSubmit={handleCreateTask}
				onShowDetail={handleShowDetailFromModal}
				defaultCreatedAt={format(effectiveCreatedAt, "yyyy-MM-dd'T'HH:mm")}
			/>

			<RecommendDetailPanel
				open={isDetailPanelOpen}
				onClose={() => setIsDetailPanelOpen(false)}
				recommendation={selectedRecommendation}
				tags={tags}
				weights={config.weights}
			/>
		</div>
	);
}
