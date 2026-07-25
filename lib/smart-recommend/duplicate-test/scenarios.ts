import { addDays, format, subDays } from "date-fns";
import { generateId } from "@/lib/task-utils";
import type { RecommendTask } from "../types";
import { DEFAULT_CONFIG } from "../constants";
import type { TestScenario } from "./types";

interface MakeTaskInput extends Partial<RecommendTask> {
	title: string;
}

function makeTask(input: MakeTaskInput, now: Date): RecommendTask {
	return {
		id: generateId(),
		title: input.title,
		date: input.date,
		startTime: input.startTime,
		endTime: input.endTime,
		isAllDay: input.isAllDay ?? false,
		tagIds: input.tagIds ?? [],
		duration: input.duration ?? 60,
		createdAt: input.createdAt ?? now.toISOString(),
		dueDate: input.dueDate,
		notes: input.notes,
		status: input.status,
		isFuture: input.isFuture,
	};
}

function isoDate(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function isoTimestamp(date: Date): string {
	return date.toISOString();
}

/**
 * Build the duplicate-prediction test scenarios anchored to the provided reference time.
 * Dates are computed relative to `now` so the suite is reproducible at any run time.
 */
export function buildScenarios(now: Date = new Date()): TestScenario[] {
	const today = isoDate(now);
	const yesterday = isoDate(subDays(now, 1));
	const tomorrow = isoDate(addDays(now, 1));
	const dayAfterTomorrow = isoDate(addDays(now, 2));
	const inThreeDays = isoDate(addDays(now, 3));
	const lastWeek = isoDate(subDays(now, 7));
	const twoWeeksAgo = isoDate(subDays(now, 14));
	const _threeWeeksAgo = isoDate(subDays(now, 21));

	// Anchor contextTime to 08:00 today so 09:00 slots remain in the future.
	const contextTimeToday = new Date(now);
	contextTimeToday.setHours(8, 0, 0, 0);

	const scenarios: TestScenario[] = [];

	// === exact: complete duplicates the engine should already filter ===

	scenarios.push({
		id: "exact-same-time",
		nameKey: "duplicateTest.scenarios.exact-same-time.name",
		descKey: "duplicateTest.scenarios.exact-same-time.desc",
		category: "exact",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "晨练",
						date: today,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 1)),
						tagIds: ["tag-exercise"],
						duration: 60,
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "晨练",
					date: today,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-exercise"],
					duration: 60,
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.exact-same-time.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.exact-same-time.suggestion",
	});

	scenarios.push({
		id: "exact-all-day",
		nameKey: "duplicateTest.scenarios.exact-all-day.name",
		descKey: "duplicateTest.scenarios.exact-all-day.desc",
		category: "exact",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "休息日",
						date: today,
						isAllDay: true,
						createdAt: isoTimestamp(subDays(now, 1)),
						tagIds: ["tag-rest"],
						duration: 0,
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "休息日",
					date: today,
					isAllDay: true,
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-rest"],
					duration: 0,
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: false,
					matchAnyTime: true,
					bothAllDay: true,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.exact-all-day.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.exact-all-day.suggestion",
	});

	scenarios.push({
		id: "exact-multiple",
		nameKey: "duplicateTest.scenarios.exact-multiple.name",
		descKey: "duplicateTest.scenarios.exact-multiple.desc",
		category: "exact",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "晨练",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
						tagIds: ["tag-exercise"],
					},
					now,
				),
				makeTask(
					{
						title: "晨练",
						date: lastWeek,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 8)),
						tagIds: ["tag-exercise"],
					},
					now,
				),
				makeTask(
					{
						title: "晨练",
						date: twoWeeksAgo,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 15)),
						tagIds: ["tag-exercise"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "晨练",
					date: today,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-exercise"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.exact-multiple.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.exact-multiple.suggestion",
	});

	// === near: near-duplicates that currently leak past the strict filter ===

	scenarios.push({
		id: "near-diff-time",
		nameKey: "duplicateTest.scenarios.near-diff-time.name",
		descKey: "duplicateTest.scenarios.near-diff-time.desc",
		category: "near",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "晨练",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
						tagIds: ["tag-exercise"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "晨练",
					date: today,
					startTime: "14:00",
					endTime: "15:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-exercise"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: false,
					matchAnyTime: true,
					bothAllDay: false,
				},
				maxConfidence: 0.5,
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.near-diff-time.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.near-diff-time.suggestion",
	});

	scenarios.push({
		id: "near-diff-date",
		nameKey: "duplicateTest.scenarios.near-diff-date.name",
		descKey: "duplicateTest.scenarios.near-diff-date.desc",
		category: "near",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "团队会议",
						date: yesterday,
						startTime: "10:00",
						endTime: "11:00",
						createdAt: isoTimestamp(subDays(now, 2)),
						tagIds: ["tag-work", "tag-social"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "团队会议",
					date: inThreeDays,
					startTime: "10:00",
					endTime: "11:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-work", "tag-social"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "any",
					dateProximityDays: 3,
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
				maxConfidence: 0.5,
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.near-diff-date.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.near-diff-date.suggestion",
	});

	scenarios.push({
		id: "near-whitespace-case",
		nameKey: "duplicateTest.scenarios.near-whitespace-case.name",
		descKey: "duplicateTest.scenarios.near-whitespace-case.desc",
		category: "near",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "math exercise",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
						tagIds: ["tag-study"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "  Math  Exercise ",
					date: today,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-study"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.7,
					matchDate: "exact",
					matchStartTime: false,
					matchAnyTime: true,
					bothAllDay: false,
				},
				maxConfidence: 0.5,
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.near-whitespace-case.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.near-whitespace-case.suggestion",
	});

	scenarios.push({
		id: "near-missing-time",
		nameKey: "duplicateTest.scenarios.near-missing-time.name",
		descKey: "duplicateTest.scenarios.near-missing-time.desc",
		category: "near",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "阅读",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
						tagIds: ["tag-reading"],
					},
					now,
				),
				makeTask(
					{
						title: "阅读",
						date: lastWeek,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 8)),
						tagIds: ["tag-reading"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "阅读",
					date: today,
					startTime: undefined,
					endTime: undefined,
					isAllDay: false,
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-reading"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: false,
					matchAnyTime: true,
					bothAllDay: false,
				},
				maxConfidence: 0.5,
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.near-missing-time.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.near-missing-time.suggestion",
	});

	// === behavior: behavior-pattern prediction should not echo just-created task ===

	scenarios.push({
		id: "behavior-just-created",
		nameKey: "duplicateTest.scenarios.behavior-just-created.name",
		descKey: "duplicateTest.scenarios.behavior-just-created.desc",
		category: "behavior",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "写周报",
						date: lastWeek,
						startTime: "16:00",
						endTime: "17:00",
						createdAt: isoTimestamp(subDays(now, 8)),
						tagIds: ["tag-work"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "写周报",
					date: tomorrow,
					startTime: "16:00",
					endTime: "17:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-work"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.behavior-just-created.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.behavior-just-created.suggestion",
	});

	scenarios.push({
		id: "behavior-repeated-creation",
		nameKey: "duplicateTest.scenarios.behavior-repeated-creation.name",
		descKey: "duplicateTest.scenarios.behavior-repeated-creation.desc",
		category: "behavior",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "晨练",
						date: twoWeeksAgo,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 15)),
					},
					now,
				),
				makeTask(
					{
						title: "晨练",
						date: lastWeek,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 8)),
					},
					now,
				),
				makeTask(
					{
						title: "晨练",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "晨练",
					date: today,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.behavior-repeated-creation.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.behavior-repeated-creation.suggestion",
	});

	scenarios.push({
		id: "behavior-accepted-rec",
		nameKey: "duplicateTest.scenarios.behavior-accepted-rec.name",
		descKey: "duplicateTest.scenarios.behavior-accepted-rec.desc",
		category: "behavior",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "晨练",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			// Simulate: user just accepted a recommendation that mirrors the just-created task.
			newlyCreatedTask: makeTask(
				{
					title: "晨练",
					date: tomorrow,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.behavior-accepted-rec.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.behavior-accepted-rec.suggestion",
	});

	// === periodic: predicted next occurrence should not collide with existing schedule ===

	// Daily pattern: 4 morning occurrences on consecutive past days.
	// ContextTime set to a morning slot identical to the existing pattern,
	// so generateNextOccurrence could land on an already-scheduled date if it ignores history.
	const dailyOccurrenceDates = [
		subDays(now, 4),
		subDays(now, 3),
		subDays(now, 2),
		subDays(now, 1),
	];
	const dailyContext = new Date(dailyOccurrenceDates[0]);
	dailyContext.setHours(9, 0, 0, 0);

	scenarios.push({
		id: "periodic-daily-existing-date",
		nameKey: "duplicateTest.scenarios.periodic-daily-existing-date.name",
		descKey: "duplicateTest.scenarios.periodic-daily-existing-date.desc",
		category: "periodic",
		setup: {
			initialTasks: dailyOccurrenceDates.map((d) =>
				makeTask(
					{
						title: "早读",
						date: isoDate(d),
						startTime: "09:00",
						endTime: "09:30",
						createdAt: isoTimestamp(subDays(d, 1)),
						tagIds: ["tag-study", "tag-reading"],
						duration: 30,
					},
					now,
				),
			),
			contextTime: isoTimestamp(dailyContext),
		},
		action: {
			// User creates today's occurrence matching the pattern.
			newlyCreatedTask: makeTask(
				{
					title: "早读",
					date: today,
					startTime: "09:00",
					endTime: "09:30",
					createdAt: isoTimestamp(dailyContext),
					tagIds: ["tag-study", "tag-reading"],
					duration: 30,
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.periodic-daily-existing-date.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.periodic-daily-existing-date.suggestion",
	});

	// Weekly pattern: 4 Monday occurrences over the past weeks.
	// ContextTime set to a Monday that already has an occurrence.
	const weeklyMondays: Date[] = [];
	const baseMonday = new Date(now);
	const currentDow = baseMonday.getDay();
	const daysToMonday = (1 - currentDow + 7) % 7;
	baseMonday.setDate(baseMonday.getDate() - daysToMonday);
	for (let i = 0; i < 4; i++) {
		const monday = new Date(baseMonday);
		monday.setDate(monday.getDate() - i * 7);
		weeklyMondays.push(monday);
	}
	const weeklyContext = new Date(weeklyMondays[0]);
	weeklyContext.setHours(10, 0, 0, 0);

	scenarios.push({
		id: "periodic-weekly-existing-date",
		nameKey: "duplicateTest.scenarios.periodic-weekly-existing-date.name",
		descKey: "duplicateTest.scenarios.periodic-weekly-existing-date.desc",
		category: "periodic",
		setup: {
			initialTasks: weeklyMondays.map((d) =>
				makeTask(
					{
						title: "周例会",
						date: isoDate(d),
						startTime: "10:00",
						endTime: "11:00",
						createdAt: isoTimestamp(subDays(d, 1)),
						tagIds: ["tag-work", "tag-social"],
						duration: 60,
					},
					now,
				),
			),
			contextTime: isoTimestamp(weeklyContext),
		},
		action: {
			// User creates a Monday occurrence that already exists in the pattern.
			newlyCreatedTask: makeTask(
				{
					title: "周例会",
					date: isoDate(weeklyMondays[0]),
					startTime: "10:00",
					endTime: "11:00",
					createdAt: isoTimestamp(weeklyContext),
					tagIds: ["tag-work", "tag-social"],
					duration: 60,
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.periodic-weekly-existing-date.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.periodic-weekly-existing-date.suggestion",
	});

	// === boundary: edge cases that must not crash or produce dup recs ===

	scenarios.push({
		id: "boundary-empty",
		nameKey: "duplicateTest.scenarios.boundary-empty.name",
		descKey: "duplicateTest.scenarios.boundary-empty.desc",
		category: "boundary",
		setup: {
			initialTasks: [],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "第一条任务",
					date: today,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-work"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.boundary-empty.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.boundary-empty.suggestion",
	});

	scenarios.push({
		id: "boundary-single-task",
		nameKey: "duplicateTest.scenarios.boundary-single-task.name",
		descKey: "duplicateTest.scenarios.boundary-single-task.desc",
		category: "boundary",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "晨练",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						createdAt: isoTimestamp(subDays(now, 2)),
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "晨练",
					date: dayAfterTomorrow,
					startTime: "09:00",
					endTime: "10:00",
					createdAt: isoTimestamp(contextTimeToday),
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.boundary-single-task.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.boundary-single-task.suggestion",
	});

	scenarios.push({
		id: "boundary-past-due",
		nameKey: "duplicateTest.scenarios.boundary-past-due.name",
		descKey: "duplicateTest.scenarios.boundary-past-due.desc",
		category: "boundary",
		setup: {
			initialTasks: [
				makeTask(
					{
						title: "提交报告",
						date: yesterday,
						startTime: "09:00",
						endTime: "10:00",
						dueDate: yesterday,
						createdAt: isoTimestamp(subDays(now, 2)),
						tagIds: ["tag-work"],
					},
					now,
				),
			],
			contextTime: isoTimestamp(contextTimeToday),
		},
		action: {
			newlyCreatedTask: makeTask(
				{
					title: "提交报告",
					date: today,
					startTime: "09:00",
					endTime: "10:00",
					dueDate: yesterday,
					createdAt: isoTimestamp(contextTimeToday),
					tagIds: ["tag-work"],
				},
				now,
			),
		},
		expected: {
			shouldNotMatch: {
				criteria: {
					titleSimilarityThreshold: 0.9,
					matchDate: "exact",
					matchStartTime: true,
					matchAnyTime: false,
					bothAllDay: false,
				},
			},
		},
		anomalyAnalysisKey: "duplicateTest.scenarios.boundary-past-due.anomaly",
		optimizationSuggestionKey: "duplicateTest.scenarios.boundary-past-due.suggestion",
	});

	// All scenarios share the default config unless overridden.
	for (const scenario of scenarios) {
		if (!scenario.setup.config) {
			scenario.setup.config = DEFAULT_CONFIG;
		}
	}

	return scenarios;
}

export const DUPLICATE_TEST_SCENARIOS: TestScenario[] = buildScenarios(new Date());
