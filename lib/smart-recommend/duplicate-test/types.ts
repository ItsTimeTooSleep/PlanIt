import type {
	AlgorithmConfig,
	AnalysisMetadata,
	Recommendation,
	RecommendTag,
	RecommendTask,
} from "../types";

export type ScenarioCategory =
	| "exact"
	| "near"
	| "behavior"
	| "periodic"
	| "boundary";

export interface DuplicateMatchCriteria {
	titleSimilarityThreshold: number;
	matchDate: "exact" | "any";
	dateProximityDays?: number;
	matchStartTime: boolean;
	matchAnyTime: boolean;
	bothAllDay: boolean;
}

export interface ShouldNotMatch {
	criteria: DuplicateMatchCriteria;
	maxConfidence?: number;
}

export interface TestScenario {
	id: string;
	nameKey: string;
	descKey: string;
	category: ScenarioCategory;
	setup: {
		initialTasks: RecommendTask[];
		config?: AlgorithmConfig;
		contextTime?: string;
	};
	action: { newlyCreatedTask: RecommendTask };
	expected: { shouldNotMatch: ShouldNotMatch };
	anomalyAnalysisKey: string;
	optimizationSuggestionKey: string;
}

export interface FlaggedRecommendation {
	recommendation: Recommendation;
	matchedCriteria: string[];
	titleSimilarity: number;
}

export type TestStatus = "pending" | "passed" | "failed";

export interface TestResult {
	scenarioId: string;
	status: TestStatus;
	recommendationCount: number;
	flagged: FlaggedRecommendation[];
	diff: { expected: string; actual: string };
	ranAt: string;
}

export interface AggregateReport {
	total: number;
	passed: number;
	failed: number;
	pending: number;
	passRate: number;
	byCategory: Record<ScenarioCategory, { total: number; passed: number }>;
	commonFailurePatterns: { patternKey: string; count: number }[];
	prioritizedSuggestions: {
		suggestionKey: string;
		affectedScenarioIds: string[];
	}[];
}

export interface RunScenarioInput {
	scenario: TestScenario;
	tags: RecommendTag[];
}

export interface RunAllScenariosInput {
	scenarios: TestScenario[];
	tags: RecommendTag[];
}

export type { AlgorithmConfig, AnalysisMetadata, Recommendation, RecommendTag, RecommendTask };
