import { addDays, format } from "date-fns";
import { generateId } from "@/lib/task-utils";
import type {
  AlgorithmConfig,
  DecisionLog,
  FeedbackRecord,
  Recommendation,
  RecommendTag,
  RecommendTask,
  SchedulingPattern,
  AccuracyStats,
} from "./types";
import {
  DEFAULT_CONFIG,
  DEFAULT_SCHEDULING_PATTERN,
  BATCH_TEMPLATES,
} from "./constants";
import { HybridRecommendationEngine } from "./engines";

export { HybridRecommendationEngine } from "./engines";

export function generateRecommendations(
  tasks: RecommendTask[],
  tags: RecommendTag[],
  config: AlgorithmConfig = DEFAULT_CONFIG,
  contextTime?: Date
): { recommendations: Recommendation[]; analysisMetadata: any; log: DecisionLog } {
  const engine = new HybridRecommendationEngine(tasks, tags, config);
  return engine.generateRecommendations(contextTime);
}

export function analyzeSchedulingPatterns(tasks: RecommendTask[]): SchedulingPattern {
  return DEFAULT_SCHEDULING_PATTERN;
}

export function calculateAccuracy(feedbacks: FeedbackRecord[]): AccuracyStats & { overall: number; recent: number } {
  const total = feedbacks.length;
  const accepted = feedbacks.filter(f => f.accepted).length;
  const rejected = total - accepted;
  const accuracy = total > 0 ? accepted / total : 0;

  const recentFeedbacks = feedbacks.slice(0, 10);
  const recentAccepted = recentFeedbacks.filter(f => f.accepted).length;
  const recentAccuracy = recentFeedbacks.length > 0 ? recentAccepted / recentFeedbacks.length : 0;

  return {
    totalRecommendations: total,
    accepted,
    rejected,
    accuracy,
    recentAccuracy: recentAccuracy,
    trend: "stable",
    factorAccuracy: {},
    overall: accuracy,
    recent: recentAccuracy,
  };
}

export function generateBatchTasks(count: number = 5, existingTasks: RecommendTask[] = []): RecommendTask[] {
	// 不再生成编造的任务，从现有任务中复现
	if (existingTasks.length === 0) {
		return [];
	}

	const tasks: RecommendTask[] = [];
	const now = new Date();

	for (let i = 0; i < Math.min(count, existingTasks.length); i++) {
		const originalTask = existingTasks[i % existingTasks.length];
		const startTime = 9 + (i % 8);

		tasks.push({
			id: generateId(),
			title: originalTask.title,
			date: format(now, "yyyy-MM-dd"),
			startTime: `${String(startTime).padStart(2, "0")}:00`,
			endTime: `${String(startTime + Math.ceil(originalTask.duration / 60)).padStart(2, "0")}:00`,
			isAllDay: false,
			tagIds: originalTask.tagIds,
			duration: originalTask.duration,
			dueDate: originalTask.dueDate,
			createdAt: now.toISOString(),
		});
	}

	return tasks;
}
