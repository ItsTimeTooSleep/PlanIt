import type { AlgorithmConfig, DecisionLog, FeedbackRecord, RecommendTag, RecommendTask, SchedulingPattern, SmartRecommendState } from "./types";
import { DEFAULT_CONFIG, DEFAULT_SCHEDULING_PATTERN, PRESET_TAGS } from "./constants";

const STORAGE_KEY = "planit_smart_recommend";
const STORAGE_VERSION = 1;

interface StorageData {
	version: number;
	tasks: RecommendTask[];
	tags: RecommendTag[];
	config: AlgorithmConfig;
	logs: DecisionLog[];
	feedbacks: FeedbackRecord[];
	schedulingPatterns: SchedulingPattern;
	customCreatedAt: string | null;
}

function validateTasks(data: unknown): RecommendTask[] {
	if (!Array.isArray(data)) return [];
	return data.filter((t: Record<string, unknown>) =>
		typeof t.id === "string" &&
		typeof t.title === "string" &&
		typeof t.isAllDay === "boolean" &&
		typeof t.duration === "number" &&
		typeof t.createdAt === "string",
	);
}

function validateConfig(data: unknown): AlgorithmConfig {
	if (!data || typeof data !== "object") return DEFAULT_CONFIG;
	const cfg = data as Record<string, unknown>;
	const w = cfg.weights as Record<string, unknown> | undefined;
	if (!w) return DEFAULT_CONFIG;
	const weights = {
		nameSimilarity: typeof w.nameSimilarity === "number" ? w.nameSimilarity : DEFAULT_CONFIG.weights.nameSimilarity,
		timePattern: typeof w.timePattern === "number" ? w.timePattern : DEFAULT_CONFIG.weights.timePattern,
		tagCorrelation: typeof w.tagCorrelation === "number" ? w.tagCorrelation : DEFAULT_CONFIG.weights.tagCorrelation,
		durationStats: typeof w.durationStats === "number" ? w.durationStats : DEFAULT_CONFIG.weights.durationStats,
		schedulingPattern: typeof w.schedulingPattern === "number" ? w.schedulingPattern : DEFAULT_CONFIG.weights.schedulingPattern,
		dueDatePattern: typeof w.dueDatePattern === "number" ? w.dueDatePattern : DEFAULT_CONFIG.weights.dueDatePattern,
		timeRelation: typeof w.timeRelation === "number" ? w.timeRelation : DEFAULT_CONFIG.weights.timeRelation,
		behaviorPrediction: typeof w.behaviorPrediction === "number" ? w.behaviorPrediction : DEFAULT_CONFIG.weights.behaviorPrediction,
		periodicPattern: typeof w.periodicPattern === "number" ? w.periodicPattern : DEFAULT_CONFIG.weights.periodicPattern,
		contextAdaptation: typeof w.contextAdaptation === "number" ? w.contextAdaptation : DEFAULT_CONFIG.weights.contextAdaptation,
	};
	return {
		weights,
		maxRecommendations: typeof cfg.maxRecommendations === "number" ? cfg.maxRecommendations : DEFAULT_CONFIG.maxRecommendations,
		minConfidence: typeof cfg.minConfidence === "number" ? cfg.minConfidence : DEFAULT_CONFIG.minConfidence,
		timeWindowHours: typeof cfg.timeWindowHours === "number" ? cfg.timeWindowHours : DEFAULT_CONFIG.timeWindowHours,
		learningRate: typeof cfg.learningRate === "number" ? cfg.learningRate : DEFAULT_CONFIG.learningRate,
		noveltyThreshold: typeof cfg.noveltyThreshold === "number" ? cfg.noveltyThreshold : DEFAULT_CONFIG.noveltyThreshold,
		explorationRate: typeof cfg.explorationRate === "number" ? cfg.explorationRate : DEFAULT_CONFIG.explorationRate,
		adaptationSpeed: typeof cfg.adaptationSpeed === "number" ? cfg.adaptationSpeed : DEFAULT_CONFIG.adaptationSpeed,
	};
}

function validateLogs(data: unknown): DecisionLog[] {
	if (!Array.isArray(data)) return [];
	return data.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const log = item as Record<string, unknown>;
		if (typeof log.id !== "string" || typeof log.timestamp !== "string") return [];

		const factorDetails = Array.isArray(log.factorDetails)
			? log.factorDetails.flatMap((detail) => {
				if (!detail || typeof detail !== "object") return [];
				const factor = detail as Record<string, unknown>;
				if (typeof factor.factor !== "string") return [];
				return [{
					factor: factor.factor,
					weight: typeof factor.weight === "number" ? factor.weight : 0,
					rawScore: typeof factor.rawScore === "number" ? factor.rawScore : 0,
					weightedScore: typeof factor.weightedScore === "number" ? factor.weightedScore : 0,
					description: typeof factor.description === "string" ? factor.description : "",
				}];
			})
			: [];

		const recommendations = Array.isArray(log.recommendations)
			? (log.recommendations as DecisionLog["recommendations"])
			: [];

		return [{
			id: log.id,
			timestamp: log.timestamp,
			contextTime: typeof log.contextTime === "string" ? log.contextTime : log.timestamp,
			factorDetails,
			recommendations,
			selectedIndex: typeof log.selectedIndex === "number" ? log.selectedIndex : null,
			analysisMetadata: log.analysisMetadata && typeof log.analysisMetadata === "object"
				? log.analysisMetadata as DecisionLog["analysisMetadata"]
				: undefined,
		}];
	});
}

function validateFeedbacks(data: unknown): FeedbackRecord[] {
	if (!Array.isArray(data)) return [];
	return data.filter((f: Record<string, unknown>) =>
		typeof f.id === "string" && typeof f.accepted === "boolean",
	);
}

function validateTags(data: unknown): RecommendTag[] {
	if (!Array.isArray(data) || data.length === 0) return PRESET_TAGS;
	const validated = data.filter((t: Record<string, unknown>) =>
		typeof t.id === 'string' &&
		typeof t.name === 'string' &&
		typeof t.color === 'string'
	);
	return validated.length > 0 ? validated : PRESET_TAGS;
}

function validateSchedulingPatterns(data: unknown): SchedulingPattern {
	if (!data || typeof data !== "object") return DEFAULT_SCHEDULING_PATTERN;
	return data as SchedulingPattern;
}

export function loadState(): SmartRecommendState {
	try {
		if (typeof window === "undefined") {
			return createDefaultState();
		}
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return createDefaultState();

		const parsed = JSON.parse(raw) as StorageData;
		if (parsed.version !== STORAGE_VERSION) {
			return migrateState(parsed);
		}

		return {
			tasks: validateTasks(parsed.tasks),
			tags: validateTags(parsed.tags),
			config: validateConfig(parsed.config),
			logs: validateLogs(parsed.logs),
			feedbacks: validateFeedbacks(parsed.feedbacks),
			schedulingPatterns: validateSchedulingPatterns(parsed.schedulingPatterns),
			customCreatedAt: typeof parsed.customCreatedAt === "string" ? parsed.customCreatedAt : null,
		};
	} catch (err) {
		console.error("[SmartRecommend] Failed to load state:", err);
		return createDefaultState();
	}
}

export function saveState(state: SmartRecommendState): boolean {
	try {
		if (typeof window === "undefined") return false;
		const data: StorageData = {
			version: STORAGE_VERSION,
			tasks: state.tasks,
			tags: state.tags,
			config: state.config,
			logs: state.logs,
			feedbacks: state.feedbacks,
			schedulingPatterns: state.schedulingPatterns,
			customCreatedAt: state.customCreatedAt,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		return true;
	} catch (err) {
		console.error("[SmartRecommend] Failed to save state:", err);
		return false;
	}
}

export function resetState(): SmartRecommendState {
	try {
		if (typeof window !== "undefined") {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch (err) {
		console.error("[SmartRecommend] Failed to reset state:", err);
	}
	return createDefaultState();
}

function createDefaultState(): SmartRecommendState {
	return {
		tasks: [],
		tags: PRESET_TAGS,
		config: DEFAULT_CONFIG,
		logs: [],
		feedbacks: [],
		schedulingPatterns: DEFAULT_SCHEDULING_PATTERN,
		customCreatedAt: null,
	};
}

function migrateState(data: StorageData): SmartRecommendState {
	const state = createDefaultState();
	state.tasks = validateTasks(data.tasks);
	state.tags = validateTags(data.tags);
	state.config = validateConfig(data.config);
	state.logs = validateLogs(data.logs);
	state.feedbacks = validateFeedbacks(data.feedbacks);
	state.schedulingPatterns = validateSchedulingPatterns(data.schedulingPatterns);
	state.customCreatedAt = typeof data.customCreatedAt === "string" ? data.customCreatedAt : null;
	saveState(state);
	return state;
}
