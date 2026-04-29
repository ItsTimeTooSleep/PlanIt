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

export function generateBatchTasks(count: number = 5): RecommendTask[] {
  const tasks: RecommendTask[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const template = BATCH_TEMPLATES[i % BATCH_TEMPLATES.length];
    const startTime = 9 + (i % 8);
    const duration = template.durationRange[0] + Math.floor(Math.random() * (template.durationRange[1] - template.durationRange[0]));
    const dueDateOffset = template.dueDateRange[0] + Math.floor(Math.random() * (template.dueDateRange[1] - template.dueDateRange[0]));

    tasks.push({
      id: generateId(),
      title: `${template.prefix} ${i + 1}`,
      date: format(now, "yyyy-MM-dd"),
      startTime: `${String(startTime).padStart(2, "0")}:00`,
      endTime: `${String(startTime + Math.ceil(duration / 60)).padStart(2, "0")}:00`,
      isAllDay: false,
      tagIds: template.tags,
      duration,
      dueDate: dueDateOffset > 0 ? format(addDays(now, dueDateOffset), "yyyy-MM-dd") : undefined,
      createdAt: now.toISOString(),
    });
  }

  return tasks;
}
