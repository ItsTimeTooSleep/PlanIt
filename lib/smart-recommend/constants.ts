import type {
  AlgorithmConfig,
  SchedulingPattern,
  RecommendTag,
} from "./types";

export const DEFAULT_SCHEDULING_PATTERN: SchedulingPattern = {
  avgLeadTimeMinutes: 0,
  timeOfDayPreferences: {},
  tagDueDatePatterns: {},
  nameDueDatePatterns: {},
  periodicPreferences: {},
};

export const DEFAULT_CONFIG: AlgorithmConfig = {
  weights: {
    nameSimilarity: 0.12,
    timePattern: 0.12,
    tagCorrelation: 0.12,
    durationStats: 0.10,
    schedulingPattern: 0.10,
    dueDatePattern: 0.10,
    timeRelation: 0.12,
    behaviorPrediction: 0.10,
    periodicPattern: 0.10,
    contextAdaptation: 0.12,
  },
  maxRecommendations: 8,
  minConfidence: 0.15,
  timeWindowHours: 2,
  learningRate: 0.05,
  noveltyThreshold: 0.3,
  explorationRate: 0.25,
  adaptationSpeed: 0.1,
};

export const PRESET_TAGS: RecommendTag[] = [
  { id: "tag-study", name: "学习", color: "var(--tag-blue)" },
  { id: "tag-exercise", name: "运动", color: "var(--tag-green)" },
  { id: "tag-rest", name: "休息", color: "var(--tag-amber)" },
  { id: "tag-social", name: "社交", color: "var(--tag-pink)" },
  { id: "tag-work", name: "工作", color: "var(--tag-purple)" },
  { id: "tag-creative", name: "创作", color: "var(--tag-red)" },
  { id: "tag-reading", name: "阅读", color: "var(--tag-cyan)" },
  { id: "tag-cooking", name: "烹饪", color: "var(--tag-orange)" },
];

export const BATCH_TEMPLATES: Array<{
  prefix: string;
  tags: string[];
  durationRange: [number, number];
  dueDateRange: [number, number];
}> = [
  { prefix: "数学练习", tags: ["tag-study"], durationRange: [60, 120], dueDateRange: [1, 3] },
  { prefix: "英语阅读", tags: ["tag-study", "tag-reading"], durationRange: [30, 90], dueDateRange: [1, 5] },
  { prefix: "跑步", tags: ["tag-exercise"], durationRange: [30, 60], dueDateRange: [0, 0] },
  { prefix: "瑜伽", tags: ["tag-exercise"], durationRange: [30, 45], dueDateRange: [0, 0] },
  { prefix: "午休", tags: ["tag-rest"], durationRange: [30, 60], dueDateRange: [0, 0] },
  { prefix: "冥想", tags: ["tag-rest"], durationRange: [15, 30], dueDateRange: [0, 0] },
  { prefix: "团队会议", tags: ["tag-social", "tag-work"], durationRange: [30, 90], dueDateRange: [0, 1] },
  { prefix: "编程", tags: ["tag-work"], durationRange: [60, 180], dueDateRange: [2, 7] },
  { prefix: "写作", tags: ["tag-creative", "tag-work"], durationRange: [45, 120], dueDateRange: [3, 10] },
  { prefix: "做饭", tags: ["tag-cooking"], durationRange: [30, 60], dueDateRange: [0, 0] },
];
