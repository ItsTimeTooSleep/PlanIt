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

  const recentCount = Math.min(10, total);
  const recentFeedbacks = feedbacks.slice(-recentCount);
  const recentAccepted = recentFeedbacks.filter(f => f.accepted).length;
  const recentAccuracy = recentFeedbacks.length > 0 ? recentAccepted / recentFeedbacks.length : 0;

  let trend: "improving" | "declining" | "stable" = "stable";
  const factorAccuracy: Record<string, number> = {};

  if (total >= 10) {
    const firstHalf = feedbacks.slice(0, Math.floor(total / 2));
    const secondHalf = feedbacks.slice(Math.floor(total / 2));
    const firstRate = firstHalf.filter(f => f.accepted).length / firstHalf.length;
    const secondRate = secondHalf.filter(f => f.accepted).length / secondHalf.length;
    const diff = secondRate - firstRate;
    if (diff > 0.1) trend = "improving";
    else if (diff < -0.1) trend = "declining";
  }

  const factorKeys = ["nameSimilarity", "timePattern", "tagCorrelation", "durationStats", "timeRelation", "periodicPattern", "contextMatch", "sequenceMatch", "frequencyScore"] as const;
  for (const key of factorKeys) {
    const withHighScore = feedbacks.filter(f => f.scores[key] >= 0.5);
    if (withHighScore.length > 0) {
      factorAccuracy[key] = withHighScore.filter(f => f.accepted).length / withHighScore.length;
    }
  }

  return {
    totalRecommendations: total,
    accepted,
    rejected,
    accuracy,
    recentAccuracy: recentAccuracy,
    trend,
    factorAccuracy,
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
