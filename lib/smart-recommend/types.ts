export interface RecommendTask {
	id: string;
	title: string;
	date?: string;
	startTime?: string;
	endTime?: string;
	isAllDay: boolean;
	tagIds: string[];
	duration: number;
	createdAt: string;
	dueDate?: string;
	isFuture?: boolean;
	notes?: string;
	status?: "pending" | "completed" | "skipped";
}

export interface RecommendTag {
	id: string;
	name: string;
	color: string;
}

export interface FactorWeights {
	nameSimilarity: number;
	timePattern: number;
	tagCorrelation: number;
	durationStats: number;
	schedulingPattern: number;
	dueDatePattern: number;
	timeRelation: number;
	behaviorPrediction: number;
	periodicPattern: number;
	contextAdaptation: number;
}

export interface FactorScores {
	nameSimilarity: number;
	timePattern: number;
	tagCorrelation: number;
	durationStats: number;
	schedulingPattern: number;
	dueDatePattern: number;
	timeRelation: number;
	behaviorPrediction: number;
	periodicPattern: number;
	contextAdaptation: number;
	total: number;
}

export interface Recommendation {
	task: RecommendTask;
	scores: FactorScores;
	confidence: number;
	reason: string;
	isNovel?: boolean;
	recommendationType?: "historical" | "predicted" | "hybrid" | "novel";
}

export interface FeedbackRecord {
	id: string;
	recommendationId: string;
	taskTitle: string;
	accepted: boolean;
	timestamp: string;
	scores: FactorScores;
	contextTime: string;
	task?: RecommendTask;
}

export interface DecisionLog {
	id: string;
	timestamp: string;
	contextTime: string;
	factorDetails: FactorDetail[];
	recommendations: Recommendation[];
	selectedIndex: number | null;
	analysisMetadata?: AnalysisMetadata;
}

export interface FactorDetail {
	factor: string;
	weight: number;
	rawScore: number;
	weightedScore: number;
	description: string;
}

export interface AlgorithmConfig {
	weights: FactorWeights;
	maxRecommendations: number;
	minConfidence: number;
	timeWindowHours: number;
	learningRate: number;
	noveltyThreshold: number;
	explorationRate: number;
	adaptationSpeed: number;
}

export interface AccuracyStats {
	totalRecommendations: number;
	accepted: number;
	rejected: number;
	accuracy: number;
	recentAccuracy: number;
	trend: "improving" | "declining" | "stable";
	factorAccuracy: Record<string, number>;
	taskCompletionEfficiency?: number;
	noveltyAcceptanceRate?: number;
}

export interface SchedulingPattern {
	avgLeadTimeMinutes: number;
	timeOfDayPreferences: Record<number, number[]>;
	tagDueDatePatterns: Record<string, { avgLeadDays: number; stdDevDays: number }>;
	nameDueDatePatterns: Record<string, { avgLeadDays: number; stdDevDays: number }>;
	periodicPreferences: Record<string, number>;
}

export interface TimeRelationPattern {
	createToPlanLeadDays: number;
	planToDueLeadDays: number;
	createToDueLeadDays: number;
	timeOfDayDistribution: Record<number, number>;
	dayOfWeekDistribution: Record<number, number>;
	confidence: number;
}

export interface PeriodicTaskPattern {
	titlePattern: string;
	exampleTitle: string;
	frequency: "daily" | "weekly" | "monthly";
	dayOfWeek?: number;
	dayOfMonth?: number;
	timeOfDay?: string;
	durationMinutes: number;
	tagIds: string[];
	occurrences: number;
	lastOccurrence: string;
	confidence: number;
}

export interface BehaviorPattern {
	taskCreationWindows: Array<{ startHour: number; endHour: number; frequency: number }>;
	deadlineLeadTimes: Record<string, number>;
	taskSequences: Array<{ sequence: string[]; frequency: number }>;
	tagCombinations: Array<{ tags: string[]; frequency: number }>;
}

export interface DynamicRule {
	id: string;
	name: string;
	condition: string;
	action: string;
	confidence: number;
	usageCount: number;
	lastUsed: string;
	ruleType: "time" | "tag" | "sequence" | "deadline";
}

export interface PredictedTask {
	title: string;
	confidence: number;
	predictedDate: string;
	predictedStartTime?: string;
	predictedEndTime?: string;
	predictedDueDate?: string;
	tagIds: string[];
	durationMinutes: number;
	predictionBasis: string;
}

export interface AnalysisMetadata {
	timeRelationPatterns?: TimeRelationPattern[];
	periodicPatterns?: PeriodicTaskPattern[];
	behaviorPatterns?: BehaviorPattern;
	dynamicRules?: DynamicRule[];
	predictedTasks?: PredictedTask[];
	timestamp: string;
}

export interface EvaluationMetrics {
	precision: number;
	recall: number;
	f1Score: number;
	acceptanceRate: number;
	taskCompletionRate: number;
	averageConfidence: number;
	noveltyScore: number;
	adaptationSpeed: number;
	trendAnalysis: {
		direction: "improving" | "declining" | "stable";
		rate: number;
	};
}

export interface LearningState {
	weights: FactorWeights;
	patternConfidence: Record<string, number>;
	ruleEffectiveness: Record<string, number>;
	userPreferenceDrift: number;
	lastUpdate: string;
}

export interface ContextInfo {
	currentTime: Date;
	currentDayOfWeek: number;
	currentHour: number;
	recentTasks: RecommendTask[];
	upcomingDeadlines: RecommendTask[];
	dayType: "workday" | "weekend" | "holiday";
	timeOfDay: "morning" | "afternoon" | "evening" | "night";
}

export interface SmartRecommendState {
	tasks: RecommendTask[];
	tags: RecommendTag[];
	config: AlgorithmConfig;
	logs: DecisionLog[];
	feedbacks: FeedbackRecord[];
	schedulingPatterns: SchedulingPattern;
	customCreatedAt: string | null;
}
