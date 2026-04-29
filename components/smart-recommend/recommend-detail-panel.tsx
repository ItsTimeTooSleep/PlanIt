"use client";

import { X, ChevronRight, ChevronLeft, Sparkles, Lightbulb, Clock, Tag, Timer, CalendarClock, BarChart2 } from "lucide-react";
import { useLanguage } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Recommendation, RecommendTag, FactorScores, FactorWeights } from "@/lib/smart-recommend/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface RecommendDetailPanelProps {
	open: boolean;
	onClose: () => void;
	recommendation: Recommendation | null;
	tags: RecommendTag[];
	weights?: FactorWeights;
}

const factorLabels = {
	nameSimilarity: { zh: "名称语义", en: "Name Similarity", icon: Lightbulb },
	timePattern: { zh: "时间模式", en: "Time Pattern", icon: Clock },
	tagCorrelation: { zh: "标签关联", en: "Tag Correlation", icon: Tag },
	durationStats: { zh: "时长统计", en: "Duration Stats", icon: Timer },
	schedulingPattern: { zh: "调度模式", en: "Scheduling Pattern", icon: ChevronRight },
	dueDatePattern: { zh: "截止日期", en: "Due Date Pattern", icon: CalendarClock },
	timeRelation: { zh: "时间关系", en: "Time Relation", icon: ChevronLeft },
	behaviorPrediction: { zh: "行为预测", en: "Behavior Prediction", icon: Sparkles },
	periodicPattern: { zh: "周期性模式", en: "Periodic Pattern", icon: BarChart2 },
	contextAdaptation: { zh: "上下文适配", en: "Context Adaptation", icon: Lightbulb },
};

const factorDescriptions = {
	nameSimilarity: {
		zh: "基于任务名称的字符相似度和语义匹配",
		en: "Based on character similarity and semantic matching of task names"
	},
	timePattern: {
		zh: "根据历史任务的创建时间和当前时段的匹配度",
		en: "Based on match between historical task creation time and current time slot"
	},
	tagCorrelation: {
		zh: "考虑标签的共现频率和近期使用偏好",
		en: "Considers tag co-occurrence frequency and recent usage preferences"
	},
	durationStats: {
		zh: "基于相似任务的历史时长分布统计",
		en: "Based on historical duration distribution statistics of similar tasks"
	},
	schedulingPattern: {
		zh: "根据用户的调度习惯和提前量模式",
		en: "Based on user's scheduling habits and lead time patterns"
	},
	dueDatePattern: {
		zh: "考虑截止日期的偏好和周期性模式",
		en: "Considers due date preferences and periodic patterns"
	},
	timeRelation: {
		zh: "分析任务创建、计划和截止日期之间的关系模式",
		en: "Analyzes the relationship patterns between task creation, planning, and due dates"
	},
	behaviorPrediction: {
		zh: "基于用户行为模式的预测分析",
		en: "Predictive analysis based on user behavior patterns"
	},
	periodicPattern: {
		zh: "识别每日、每周、每月的周期性任务模式",
		en: "Identifies daily, weekly, monthly periodic task patterns"
	},
	contextAdaptation: {
		zh: "根据当前时间、日期类型等上下文因素调整推荐",
		en: "Adjusts recommendations based on contextual factors like current time and day type"
	},
};

export function RecommendDetailPanel({
	open,
	onClose,
	recommendation,
	tags,
	weights,
}: RecommendDetailPanelProps) {
	const lang = useLanguage();

	if (!open || !recommendation) return null;

	const { task, scores, confidence, reason } = recommendation;
	const taskTags = tags.filter((t) => task.tagIds.includes(t.id));

	const factors = Object.entries(factorLabels) as Array<[keyof Omit<FactorScores, 'total'>, typeof factorLabels.nameSimilarity]>;

	return (
		<div className="fixed inset-y-0 right-0 z-[99999] w-96 bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right">
			<div className="flex items-center justify-between p-4 border-b border-border">
				<div className="flex items-center gap-2">
					<BarChart2 className="w-5 h-5 text-primary" />
					<h2 className="text-sm font-semibold">
						{lang === "zh" ? "推荐详情分析" : "Recommendation Detail Analysis"}
					</h2>
				</div>
				<Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
					<X className="w-4 h-4" />
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto p-4">
				<div className="space-y-6">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 mb-3">
							<Sparkles className="w-8 h-8 text-amber-500" />
						</div>
						<h3 className="text-lg font-semibold mb-1">{task.title}</h3>
						<div className="flex items-center justify-center gap-2">
							<Badge className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
								{Math.round(confidence * 100)}% {lang === "zh" ? "置信度" : "Confidence"}
							</Badge>
							{task.duration > 0 && (
								<Badge variant="secondary" className="text-xs px-2 py-0.5">
									{task.duration} {lang === "zh" ? "分钟" : "min"}
								</Badge>
							)}
						</div>
					</div>

					<div className="flex flex-wrap gap-1.5 justify-center">
						{taskTags.map((tag) => (
							<Badge key={tag.id} variant="secondary" className="text-xs px-2 py-0.5">
								<div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
								{tag.name}
							</Badge>
						))}
						{task.date && (
							<Badge variant="outline" className="text-xs px-2 py-0.5">
								{task.date}
							</Badge>
						)}
						{task.startTime && task.endTime && (
							<Badge variant="outline" className="text-xs px-2 py-0.5">
								{task.startTime} - {task.endTime}
							</Badge>
						)}
						{task.dueDate && (
							<Badge variant="outline" className="text-xs px-2 py-0.5 text-orange-600 border-orange-300">
								{lang === "zh" ? "截止" : "Due"} {task.dueDate}
							</Badge>
						)}
					</div>

					<Card className="bg-muted/30">
						<CardHeader className="pb-2 pt-3 px-3">
							<CardTitle className="text-xs flex items-center gap-1.5">
								<Lightbulb className="w-3.5 h-3.5 text-amber-500" />
								{lang === "zh" ? "推荐理由" : "Recommendation Reason"}
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0 pb-3 px-3">
							<p className="text-xs text-muted-foreground">{reason}</p>
						</CardContent>
					</Card>

					<Separator />

					<div>
						<h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
							<BarChart2 className="w-4 h-4 text-primary" />
							{lang === "zh" ? "评分详情" : "Score Details"}
						</h4>
						<div className="space-y-4">
							{factors.map(([key, label]) => {
								const Icon = label.icon;
								const score = scores[key];
								const weight = weights?.[key];
								const pct = Math.round(score * 100);
								const weightPct = weight ? Math.round(weight * 100) : null;

								return (
									<div key={key} className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Icon className="w-3.5 h-3.5 text-muted-foreground" />
												<span className="text-xs font-medium">
													{lang === "zh" ? label.zh : label.en}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{weightPct !== null && (
													<span className="text-[10px] text-muted-foreground">
														{weightPct}% {lang === "zh" ? "权重" : "weight"}
													</span>
												)}
												<span className="text-xs font-semibold">{pct}%</span>
											</div>
										</div>
										<Progress
											value={pct}
											className={cn(
												"h-2",
												pct >= 60 ? "bg-emerald-500/20" : pct >= 30 ? "bg-amber-500/20" : "bg-red-400/20"
											)}
										/>
										<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
											<div
												className={cn(
													"h-full rounded-full transition-all duration-500",
													pct >= 60 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-red-400",
												)}
												style={{ width: `${pct}%` }}
											/>
										</div>
										<p className="text-[10px] text-muted-foreground">
											{lang === "zh" ? factorDescriptions[key].zh : factorDescriptions[key].en}
										</p>
									</div>
								);
							})}
						</div>
					</div>

					<Separator />

					<div className="bg-muted/20 rounded-lg p-3">
						<h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
							<Sparkles className="w-3.5 h-3.5 text-primary" />
							{lang === "zh" ? "综合评分计算" : "Composite Score Calculation"}
						</h4>
						<div className="space-y-1.5">
							{factors.map(([key, label]) => {
								const score = scores[key];
								const weight = weights?.[key];
								if (!weight) return null;
								const weightedScore = score * weight;
								const pct = Math.round(weightedScore * 100);

								return (
									<div key={key} className="flex items-center justify-between text-[10px]">
										<span className="text-muted-foreground">
											{lang === "zh" ? label.zh : label.en}
										</span>
										<span className="font-mono">
											{Math.round(score * 100)}% × {Math.round(weight * 100)}% = {pct}%
										</span>
									</div>
								);
							})}
							<Separator className="my-2" />
							<div className="flex items-center justify-between text-xs font-semibold">
								<span>{lang === "zh" ? "总置信度" : "Total Confidence"}</span>
								<span className="text-primary">{Math.round(confidence * 100)}%</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
