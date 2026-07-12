import { differenceInCalendarDays, parseISO } from "date-fns";
import { generateRecommendations } from "../engine";
import { calculateNameSimilarityScore } from "../utils/string";
import type {
	AggregateReport,
	DuplicateMatchCriteria,
	FlaggedRecommendation,
	RecommendTag,
	ScenarioCategory,
	TestResult,
	TestScenario,
} from "./types";

function dateDiffInDays(left: string | undefined, right: string | undefined): number | null {
	if (!left || !right) return null;
	try {
		return differenceInCalendarDays(parseISO(left), parseISO(right));
	} catch {
		return null;
	}
}

function matchesCriteria(
	recommendationTitle: string,
	recommendationDate: string | undefined,
	recommendationStartTime: string | undefined,
	recommendationIsAllDay: boolean,
	createdTitle: string,
	createdDate: string | undefined,
	createdStartTime: string | undefined,
	createdIsAllDay: boolean,
	criteria: DuplicateMatchCriteria,
): { matched: boolean; titleSimilarity: number; reasons: string[] } {
	const titleSimilarity = calculateNameSimilarityScore(recommendationTitle, createdTitle, 2);
	const reasons: string[] = [];

	if (titleSimilarity < criteria.titleSimilarityThreshold) {
		return { matched: false, titleSimilarity, reasons };
	}
	reasons.push(`titleSim=${titleSimilarity.toFixed(2)}>=${criteria.titleSimilarityThreshold}`);

	// Date matching
	if (criteria.matchDate === "exact") {
		const proximity = criteria.dateProximityDays ?? 0;
		const diff = dateDiffInDays(recommendationDate, createdDate);
		if (diff === null || Math.abs(diff) > proximity) {
			return { matched: false, titleSimilarity, reasons };
		}
		reasons.push(`dateMatch=${recommendationDate}~${createdDate}`);
	}

	// Time matching
	if (criteria.bothAllDay) {
		if (!(recommendationIsAllDay && createdIsAllDay)) {
			return { matched: false, titleSimilarity, reasons };
		}
		reasons.push("bothAllDay=true");
	} else if (criteria.matchAnyTime) {
		// any time is acceptable — no extra constraint
	} else if (criteria.matchStartTime) {
		if (!recommendationStartTime || !createdStartTime) {
			return { matched: false, titleSimilarity, reasons };
		}
		if (recommendationStartTime !== createdStartTime) {
			return { matched: false, titleSimilarity, reasons };
		}
		reasons.push(`startTimeMatch=${recommendationStartTime}`);
	}

	return { matched: true, titleSimilarity, reasons };
}

function summarizeFlagged(flagged: FlaggedRecommendation[]): string {
	if (flagged.length === 0) return "[]";
	return flagged
		.map((f) => {
			const t = f.recommendation.task;
			return `{title="${t.title}", date=${t.date ?? "—"}, start=${t.startTime ?? "—"}, conf=${f.recommendation.confidence.toFixed(2)}, sim=${f.titleSimilarity.toFixed(2)}, reasons=[${f.matchedCriteria.join(", ")}]}`;
		})
		.join(" | ");
}

export function runScenario(scenario: TestScenario, tags: RecommendTag[]): TestResult {
	const allTasks = [...scenario.setup.initialTasks, scenario.action.newlyCreatedTask];
	const ctx = scenario.setup.contextTime ? new Date(scenario.setup.contextTime) : new Date();
	const config = scenario.setup.config;

	const { recommendations } = generateRecommendations(allTasks, tags, config, ctx);

	const created = scenario.action.newlyCreatedTask;
	const criteria = scenario.expected.shouldNotMatch.criteria;
	const maxConfidence = scenario.expected.shouldNotMatch.maxConfidence;

	const flagged: FlaggedRecommendation[] = [];

	for (const rec of recommendations) {
		const matchResult = matchesCriteria(
			rec.task.title,
			rec.task.date,
			rec.task.startTime,
			rec.task.isAllDay,
			created.title,
			created.date,
			created.startTime,
			created.isAllDay,
			criteria,
		);

		if (!matchResult.matched) continue;

		const reasons = [...matchResult.reasons];
		let confidenceExceeded = false;
		if (maxConfidence !== undefined && rec.confidence > maxConfidence) {
			reasons.push(`conf=${rec.confidence.toFixed(2)}>${maxConfidence}`);
			confidenceExceeded = true;
		}

		// Flag when the criteria matches. If maxConfidence is specified, only flag
		// when the confidence ceiling is also exceeded; otherwise any match is a leak.
		if (maxConfidence === undefined || confidenceExceeded) {
			flagged.push({
				recommendation: rec,
				matchedCriteria: reasons,
				titleSimilarity: matchResult.titleSimilarity,
			});
		}
	}

	const status: TestResult["status"] = flagged.length === 0 ? "passed" : "failed";

	const expectedText = `No recommendation should match: titleSim>=${criteria.titleSimilarityThreshold}, date=${criteria.matchDate}${criteria.dateProximityDays !== undefined ? `±${criteria.dateProximityDays}d` : ""}, time=${criteria.bothAllDay ? "bothAllDay" : criteria.matchAnyTime ? "any" : criteria.matchStartTime ? "exact" : "none"}${maxConfidence !== undefined ? `, conf<=${maxConfidence}` : ""}`;

	const actualText = `Recommendations: ${recommendations.length} | Flagged: ${flagged.length} | ${summarizeFlagged(flagged)}`;

	return {
		scenarioId: scenario.id,
		status,
		recommendationCount: recommendations.length,
		flagged,
		diff: { expected: expectedText, actual: actualText },
		ranAt: new Date().toISOString(),
	};
}

export function buildReport(
	scenarios: TestScenario[],
	results: Record<string, TestResult>,
): AggregateReport {
	const byCategory: Record<ScenarioCategory, { total: number; passed: number }> = {
		exact: { total: 0, passed: 0 },
		near: { total: 0, passed: 0 },
		behavior: { total: 0, passed: 0 },
		periodic: { total: 0, passed: 0 },
		boundary: { total: 0, passed: 0 },
	};

	const failurePatternCounts: Record<string, { count: number; scenarioIds: string[] }> = {};
	const suggestionMap: Record<string, string[]> = {};

	let passed = 0;
	let failed = 0;

	for (const scenario of scenarios) {
		byCategory[scenario.category].total += 1;
		const result = results[scenario.id];
		if (!result) continue;

		if (result.status === "passed") {
			passed += 1;
			byCategory[scenario.category].passed += 1;
		} else if (result.status === "failed") {
			failed += 1;

			const patternKey = scenario.anomalyAnalysisKey;
			if (!failurePatternCounts[patternKey]) {
				failurePatternCounts[patternKey] = { count: 0, scenarioIds: [] };
			}
			failurePatternCounts[patternKey].count += 1;
			failurePatternCounts[patternKey].scenarioIds.push(scenario.id);

			const suggestionKey = scenario.optimizationSuggestionKey;
			if (!suggestionMap[suggestionKey]) {
				suggestionMap[suggestionKey] = [];
			}
			suggestionMap[suggestionKey].push(scenario.id);
		}
	}

	const total = scenarios.length;
	const pending = total - passed - failed;

	const commonFailurePatterns = Object.entries(failurePatternCounts)
		.map(([patternKey, info]) => ({ patternKey, count: info.count }))
		.sort((a, b) => b.count - a.count);

	const prioritizedSuggestions = Object.entries(suggestionMap)
		.map(([suggestionKey, affectedScenarioIds]) => ({
			suggestionKey,
			affectedScenarioIds: [...affectedScenarioIds],
		}))
		.sort((a, b) => b.affectedScenarioIds.length - a.affectedScenarioIds.length);

	return {
		total,
		passed,
		failed,
		pending,
		passRate: total > 0 ? passed / total : 0,
		byCategory,
		commonFailurePatterns,
		prioritizedSuggestions,
	};
}

export function runAllScenarios(
	scenarios: TestScenario[],
	tags: RecommendTag[],
): { results: Record<string, TestResult>; report: AggregateReport } {
	const results: Record<string, TestResult> = {};

	for (const scenario of scenarios) {
		results[scenario.id] = runScenario(scenario, tags);
	}

	return { results, report: buildReport(scenarios, results) };
}
