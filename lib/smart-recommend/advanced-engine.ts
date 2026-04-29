import { addDays, format, getDay, getHours, getMinutes, parseISO, subDays, differenceInDays } from "date-fns";
import { generateId } from "@/lib/task-utils";
import type {
	AlgorithmConfig,
	RecommendTask,
	RecommendTag,
	TimeRelationPattern,
	PeriodicTaskPattern,
	BehaviorPattern,
	DynamicRule,
	PredictedTask,
	ContextInfo,
	EvaluationMetrics,
	LearningState,
	Recommendation,
	FactorScores,
	DecisionLog,
	FactorDetail,
	FeedbackRecord,
} from "./types";

export class TimeRelationAnalyzer {
	private tasks: RecommendTask[];

	constructor(tasks: RecommendTask[]) {
		this.tasks = tasks;
	}

	public analyzeTimeRelations(): TimeRelationPattern[] {
		const validTasks = this.tasks.filter((t) => t.createdAt && t.date && t.dueDate);
		if (validTasks.length < 5) return [];

		const patterns: TimeRelationPattern[] = [];
		const groupedByTag = this.groupTasksByTag(validTasks);

		for (const [tagId, tagTasks] of Object.entries(groupedByTag)) {
			const pattern = this.analyzeTagTimeRelations(tagTasks);
			if (pattern.confidence > 0.3) {
				patterns.push(pattern);
			}
		}

		const globalPattern = this.analyzeTagTimeRelations(validTasks);
		if (globalPattern.confidence > 0.2) {
			patterns.unshift(globalPattern);
		}

		return patterns.sort((a, b) => b.confidence - a.confidence);
	}

	private groupTasksByTag(tasks: RecommendTask[]): Record<string, RecommendTask[]> {
		const groups: Record<string, RecommendTask[]> = { global: tasks };
		for (const task of tasks) {
			for (const tagId of task.tagIds) {
				if (!groups[tagId]) groups[tagId] = [];
				groups[tagId].push(task);
			}
		}
		return groups;
	}

	private analyzeTagTimeRelations(tasks: RecommendTask[]): TimeRelationPattern {
		const createToPlanDays: number[] = [];
		const planToDueDays: number[] = [];
		const createToDueDays: number[] = [];
		const timeOfDay: Record<number, number> = {};
		const dayOfWeek: Record<number, number> = {};

		for (const task of tasks) {
			try {
				const createdDate = parseISO(task.createdAt);
				const planDate = parseISO(task.date!);
				const dueDate = parseISO(task.dueDate!);

				const createToPlan = differenceInDays(planDate, createdDate);
				const planToDue = differenceInDays(dueDate, planDate);
				const createToDue = differenceInDays(dueDate, createdDate);

				if (createToPlan >= 0) createToPlanDays.push(createToPlan);
				if (planToDue >= 0) planToDueDays.push(planToDue);
				if (createToDue >= 0) createToDueDays.push(createToDue);

				if (task.startTime) {
					const hour = parseInt(task.startTime.split(':')[0]);
					timeOfDay[hour] = (timeOfDay[hour] || 0) + 1;
				}

				const dow = getDay(planDate);
				dayOfWeek[dow] = (dayOfWeek[dow] || 0) + 1;
			} catch {
				continue;
			}
		}

		const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
		const confidence = Math.min(1, tasks.length / 30);

		return {
			createToPlanLeadDays: Math.round(avg(createToPlanDays) * 10) / 10,
			planToDueLeadDays: Math.round(avg(planToDueDays) * 10) / 10,
			createToDueLeadDays: Math.round(avg(createToDueDays) * 10) / 10,
			timeOfDayDistribution: timeOfDay,
			dayOfWeekDistribution: dayOfWeek,
			confidence,
		};
	}

	public calculateTimeRelationScore(task: RecommendTask, context: ContextInfo, patterns: TimeRelationPattern[]): number {
		if (patterns.length === 0) return 0.3;

		let score = 0;
		const bestPattern = patterns[0];

		try {
			if (task.date && task.dueDate) {
				const planDate = parseISO(task.date);
				const dueDate = parseISO(task.dueDate);
				const planToDue = differenceInDays(dueDate, planDate);
				const deviation = Math.abs(planToDue - bestPattern.planToDueLeadDays);
				score += Math.max(0, 1 - deviation / Math.max(bestPattern.planToDueLeadDays, 7)) * 0.4;
			}

			if (task.startTime) {
				const taskHour = parseInt(task.startTime.split(':')[0]);
				const contextHour = context.currentHour;
				const hourDeviation = Math.abs(taskHour - contextHour);
				score += Math.max(0, 1 - hourDeviation / 6) * 0.3;
			}

			if (task.date) {
				const taskDow = getDay(parseISO(task.date));
				const contextDow = context.currentDayOfWeek;
				score += (taskDow === contextDow ? 0.3 : 0.15);
			}
		} catch {
			return 0.3;
		}

		return Math.min(1, score);
	}
}

export class PeriodicTaskDetector {
	private tasks: RecommendTask[];

	constructor(tasks: RecommendTask[]) {
		this.tasks = tasks;
	}

	public detectPeriodicPatterns(): PeriodicTaskPattern[] {
		const patterns: PeriodicTaskPattern[] = [];
		const titleGroups = this.groupTasksByTitlePattern();

		for (const [titlePattern, tasks] of Object.entries(titleGroups)) {
			if (tasks.length < 3) continue;

			const dailyPattern = this.checkDailyPattern(tasks, titlePattern);
			if (dailyPattern && dailyPattern.confidence > 0.5) {
				patterns.push(dailyPattern);
				continue;
			}

			const weeklyPattern = this.checkWeeklyPattern(tasks, titlePattern);
			if (weeklyPattern && weeklyPattern.confidence > 0.5) {
				patterns.push(weeklyPattern);
				continue;
			}

			const monthlyPattern = this.checkMonthlyPattern(tasks, titlePattern);
			if (monthlyPattern && monthlyPattern.confidence > 0.5) {
				patterns.push(monthlyPattern);
			}
		}

		return patterns.sort((a, b) => b.confidence - a.confidence);
	}

	private groupTasksByTitlePattern(): Record<string, RecommendTask[]> {
		const groups: Record<string, RecommendTask[]> = {};

		for (const task of this.tasks) {
			const baseTitle = this.extractBaseTitle(task.title);
			if (!groups[baseTitle]) groups[baseTitle] = [];
			groups[baseTitle].push(task);
		}

		return groups;
	}

	private extractBaseTitle(title: string): string {
		return title.replace(/\s*#?\d+\s*$/g, '').trim().toLowerCase();
	}

	private checkDailyPattern(tasks: RecommendTask[], titlePattern: string): PeriodicTaskPattern | null {
		if (tasks.length < 3) return null;

		const timeOccurrences = new Map<string, number>();
		let durationSum = 0;
		const tagSet = new Set<string>();
		let lastOccurrence = '';

		for (const task of tasks) {
			if (task.startTime && task.date) {
				const timeKey = task.startTime.substring(0, 5);
				timeOccurrences.set(timeKey, (timeOccurrences.get(timeKey) || 0) + 1);
			}
			durationSum += task.duration;
			for (const tag of task.tagIds) tagSet.add(tag);
			if (task.date && (!lastOccurrence || parseISO(task.date) > parseISO(lastOccurrence))) {
				lastOccurrence = task.date;
			}
		}

		if (timeOccurrences.size > 0) {
			const mostFrequentTime = Array.from(timeOccurrences.entries()).sort((a, b) => b[1] - a[1])[0];
			const confidence = mostFrequentTime[1] / tasks.length;

			if (confidence >= 0.6) {
				return {
					titlePattern,
					frequency: "daily",
					timeOfDay: mostFrequentTime[0],
					durationMinutes: Math.round(durationSum / tasks.length),
					tagIds: Array.from(tagSet),
					occurrences: tasks.length,
					lastOccurrence,
					confidence,
				};
			}
		}

		return null;
	}

	private checkWeeklyPattern(tasks: RecommendTask[], titlePattern: string): PeriodicTaskPattern | null {
		if (tasks.length < 3) return null;

		const dayOccurrences = new Map<number, number>();
		let durationSum = 0;
		const tagSet = new Set<string>();
		let lastOccurrence = '';

		for (const task of tasks) {
			if (task.date) {
				const dow = getDay(parseISO(task.date));
				dayOccurrences.set(dow, (dayOccurrences.get(dow) || 0) + 1);
			}
			durationSum += task.duration;
			for (const tag of task.tagIds) tagSet.add(tag);
			if (task.date && (!lastOccurrence || parseISO(task.date) > parseISO(lastOccurrence))) {
				lastOccurrence = task.date;
			}
		}

		if (dayOccurrences.size > 0) {
			const mostFrequentDay = Array.from(dayOccurrences.entries()).sort((a, b) => b[1] - a[1])[0];
			const confidence = mostFrequentDay[1] / tasks.length;

			if (confidence >= 0.5) {
				return {
					titlePattern,
					frequency: "weekly",
					dayOfWeek: mostFrequentDay[0],
					durationMinutes: Math.round(durationSum / tasks.length),
					tagIds: Array.from(tagSet),
					occurrences: tasks.length,
					lastOccurrence,
					confidence,
				};
			}
		}

		return null;
	}

	private checkMonthlyPattern(tasks: RecommendTask[], titlePattern: string): PeriodicTaskPattern | null {
		if (tasks.length < 3) return null;

		const dayOccurrences = new Map<number, number>();
		let durationSum = 0;
		const tagSet = new Set<string>();
		let lastOccurrence = '';

		for (const task of tasks) {
			if (task.date) {
				const dom = parseISO(task.date).getDate();
				dayOccurrences.set(dom, (dayOccurrences.get(dom) || 0) + 1);
			}
			durationSum += task.duration;
			for (const tag of task.tagIds) tagSet.add(tag);
			if (task.date && (!lastOccurrence || parseISO(task.date) > parseISO(lastOccurrence))) {
				lastOccurrence = task.date;
			}
		}

		if (dayOccurrences.size > 0) {
			const mostFrequentDay = Array.from(dayOccurrences.entries()).sort((a, b) => b[1] - a[1])[0];
			const confidence = mostFrequentDay[1] / tasks.length;

			if (confidence >= 0.5) {
				return {
					titlePattern,
					frequency: "monthly",
					dayOfMonth: mostFrequentDay[0],
					durationMinutes: Math.round(durationSum / tasks.length),
					tagIds: Array.from(tagSet),
					occurrences: tasks.length,
					lastOccurrence,
					confidence,
				};
			}
		}

		return null;
	}

	public calculatePeriodicScore(task: RecommendTask, patterns: PeriodicTaskPattern[]): number {
		if (patterns.length === 0) return 0.3;

		const baseTitle = this.extractBaseTitle(task.title);
		const matchingPattern = patterns.find(p => p.titlePattern === baseTitle);

		if (matchingPattern) {
			return 0.5 + matchingPattern.confidence * 0.5;
		}

		return 0.3;
	}

	public generateNextOccurrence(pattern: PeriodicTaskPattern, context: ContextInfo): PredictedTask | null {
		let predictedDate: Date | null = null;
		const now = context.currentTime;

		switch (pattern.frequency) {
			case "daily":
				predictedDate = new Date(now);
				if (pattern.timeOfDay) {
					const [hours, minutes] = pattern.timeOfDay.split(':').map(Number);
					predictedDate.setHours(hours, minutes, 0, 0);
					if (predictedDate <= now) {
						predictedDate = addDays(predictedDate, 1);
					}
				}
				break;

			case "weekly":
				if (pattern.dayOfWeek !== undefined) {
					predictedDate = new Date(now);
					const currentDow = getDay(now);
					let daysToAdd = pattern.dayOfWeek - currentDow;
					if (daysToAdd <= 0) daysToAdd += 7;
					predictedDate = addDays(predictedDate, daysToAdd);
				}
				break;

			case "monthly":
				if (pattern.dayOfMonth !== undefined) {
					predictedDate = new Date(now);
					if (predictedDate.getDate() > pattern.dayOfMonth) {
						predictedDate.setMonth(predictedDate.getMonth() + 1);
					}
					predictedDate.setDate(pattern.dayOfMonth);
				}
				break;
		}

		if (!predictedDate) return null;

		return {
			title: pattern.titlePattern,
			confidence: pattern.confidence,
			predictedDate: format(predictedDate, 'yyyy-MM-dd'),
			predictedStartTime: pattern.timeOfDay,
			predictedDueDate: pattern.titlePattern.includes('学习') || pattern.titlePattern.includes('作业') ? format(addDays(predictedDate, 1), 'yyyy-MM-dd') : undefined,
			tagIds: pattern.tagIds,
			durationMinutes: pattern.durationMinutes,
			predictionBasis: `周期性任务模式 (${pattern.frequency})`,
		};
	}
}

export class BehaviorPredictor {
	private tasks: RecommendTask[];

	constructor(tasks: RecommendTask[]) {
		this.tasks = tasks;
	}

	public analyzeBehaviorPatterns(): BehaviorPattern {
		return {
			taskCreationWindows: this.analyzeCreationWindows(),
			deadlineLeadTimes: this.analyzeDeadlineLeadTimes(),
			taskSequences: this.analyzeTaskSequences(),
			tagCombinations: this.analyzeTagCombinations(),
		};
	}

	private analyzeCreationWindows() {
		const windows: Array<{ startHour: number; endHour: number; frequency: number }> = [];
		const hourCounts: Record<number, number> = {};

		for (const task of this.tasks) {
			try {
				const hour = getHours(parseISO(task.createdAt));
				hourCounts[hour] = (hourCounts[hour] || 0) + 1;
			} catch {
				continue;
			}
		}

		for (let i = 0; i < 24; i += 2) {
			let count = 0;
			for (let j = 0; j < 2; j++) {
				count += hourCounts[i + j] || 0;
			}
			if (count > 0) {
				windows.push({
					startHour: i,
					endHour: i + 2,
					frequency: count,
				});
			}
		}

		return windows.sort((a, b) => b.frequency - a.frequency);
	}

	private analyzeDeadlineLeadTimes(): Record<string, number> {
		const leadTimes: Record<string, number> = {};
		const tagLeadTimes: Record<string, number[]> = {};

		for (const task of this.tasks) {
			task.tagIds.forEach(tag => {
				if (!tagLeadTimes[tag]) tagLeadTimes[tag] = [];
				if (task.date && task.dueDate) {
					try {
						const lead = differenceInDays(parseISO(task.dueDate), parseISO(task.date));
						if (lead >= 0) tagLeadTimes[tag].push(lead);
					} catch { }
				}
			});
		}

		for (const [tag, times] of Object.entries(tagLeadTimes)) {
			if (times.length > 0) {
				leadTimes[tag] = times.reduce((a, b) => a + b, 0) / times.length;
			}
		}

		return leadTimes;
	}

	private analyzeTaskSequences() {
		return [];
	}

	private analyzeTagCombinations() {
		const combinations: Record<string, number> = {};

		for (const task of this.tasks) {
			const key = task.tagIds.sort().join(',');
			if (key) {
				combinations[key] = (combinations[key] || 0) + 1;
			}
		}

		return Object.entries(combinations)
			.map(([tags, frequency]) => ({ tags: tags.split(','), frequency }))
			.sort((a, b) => b.frequency - a.frequency);
	}

	public predictDeadline(task: Partial<RecommendTask>, context: ContextInfo, behavior: BehaviorPattern): { dueDate?: string; date?: string } {
		const result: { dueDate?: string; date?: string } = {};

		const now = context.currentTime;
		result.date = format(now, 'yyyy-MM-dd');

		if (task.tagIds && task.tagIds.length > 0) {
			let avgLead = 1;
			let count = 0;

			for (const tag of task.tagIds) {
				if (behavior.deadlineLeadTimes[tag]) {
					avgLead += behavior.deadlineLeadTimes[tag];
					count++;
				}
			}

			if (count > 0) {
				avgLead /= count;
				result.dueDate = format(addDays(now, Math.round(avgLead)), 'yyyy-MM-dd');
			} else {
				result.dueDate = format(addDays(now, 1), 'yyyy-MM-dd');
			}
		} else {
			result.dueDate = format(addDays(now, 1), 'yyyy-MM-dd');
		}

		return result;
	}

	public predictTime(behavior: BehaviorPattern, context: ContextInfo): { startTime?: string; endTime?: string } {
		if (behavior.taskCreationWindows.length === 0) return {};

		const currentHour = context.currentHour;
		let bestWindow = behavior.taskCreationWindows[0];
		let minDiff = Infinity;

		for (const window of behavior.taskCreationWindows) {
			const windowMid = (window.startHour + window.endHour) / 2;
			const diff = Math.abs(currentHour - windowMid);
			if (diff < minDiff) {
				minDiff = diff;
				bestWindow = window;
			}
		}

		const preferredHour = bestWindow.startHour;
		const startTime = `${String(preferredHour).padStart(2, '0')}:00`;
		const endTime = `${String(Math.min(preferredHour + 1, 23)).padStart(2, '0')}:00`;

		return { startTime, endTime };
	}

	public calculateBehaviorPredictionScore(task: RecommendTask, context: ContextInfo, behavior: BehaviorPattern): number {
		let score = 0.3;

		if (task.startTime) {
			const taskHour = parseInt(task.startTime.split(':')[0]);
			const matchingWindow = behavior.taskCreationWindows.find(w =>
				taskHour >= w.startHour && taskHour < w.endHour);
			if (matchingWindow) {
				const maxFrequency = behavior.taskCreationWindows.length > 0 
					? Math.max(...behavior.taskCreationWindows.map(w => w.frequency)) 
					: 1;
				score += 0.3 * (matchingWindow.frequency / Math.max(maxFrequency, 1));
			}
		}

		if (task.tagIds.length > 0) {
			const tagKey = task.tagIds.sort().join(',');
			const matchingCombo = behavior.tagCombinations.find(c => c.tags.sort().join(',') === tagKey);
			if (matchingCombo) {
				const maxFrequency = behavior.tagCombinations.length > 0 
					? Math.max(...behavior.tagCombinations.map(c => c.frequency)) 
					: 1;
				score += 0.4 * (matchingCombo.frequency / Math.max(maxFrequency, 1));
			}
		}

		return Math.min(1, score);
	}
}

export class DynamicRuleGenerator {
	private tasks: RecommendTask[];
	private rules: DynamicRule[] = [];

	constructor(tasks: RecommendTask[]) {
		this.tasks = tasks;
		this.rules = this.generateInitialRules();
	}

	private generateInitialRules(): DynamicRule[] {
		const rules: DynamicRule[] = [];

		const timeRule = this.generateTimeRule();
		if (timeRule) rules.push(timeRule);

		const tagRules = this.generateTagRules();
		rules.push(...tagRules);

		return rules;
	}

	private generateTimeRule(): DynamicRule | null {
		const morningTasks = this.tasks.filter(t => {
			if (!t.startTime) return false;
			const hour = parseInt(t.startTime.split(':')[0]);
			return hour >= 6 && hour < 12;
		});

		if (morningTasks.length > 5) {
			const studyTags = morningTasks.filter(t => t.tagIds.includes('tag-study')).length;
			if (studyTags / morningTasks.length > 0.5) {
				return {
					id: generateId(),
					name: '早晨学习',
					condition: 'timeOfDay === "morning"',
					action: 'recommend study tasks',
					confidence: 0.7,
					usageCount: 0,
					lastUsed: new Date().toISOString(),
					ruleType: 'time',
				};
			}
		}
		return null;
	}

	private generateTagRules(): DynamicRule[] {
		const rules: DynamicRule[] = [];
		const tagPairs: Record<string, number> = {};

		for (const task of this.tasks) {
			const tags = task.tagIds;
			for (let i = 0; i < tags.length; i++) {
				for (let j = i + 1; j < tags.length; j++) {
					const pair = [tags[i], tags[j]].sort().join('|');
					tagPairs[pair] = (tagPairs[pair] || 0) + 1;
				}
			}
		}

		for (const [pair, count] of Object.entries(tagPairs)) {
			if (count >= 3) {
				rules.push({
					id: generateId(),
					name: `标签组合: ${pair}`,
					condition: `hasTag(${pair.split('|')[0]}`,
					action: `alsoAddTag(${pair.split('|')[1]})`,
					confidence: Math.min(0.9, count / 10),
					usageCount: 0,
					lastUsed: new Date().toISOString(),
					ruleType: 'tag',
				});
			}
		}

		return rules;
	}

	public getRules(): DynamicRule[] {
		return this.rules.sort((a, b) => b.confidence - a.confidence);
	}

	public updateRuleUsage(ruleId: string, success: boolean) {
		const rule = this.rules.find(r => r.id === ruleId);
		if (rule) {
			rule.usageCount++;
			rule.lastUsed = new Date().toISOString();
			if (success) {
				rule.confidence = Math.min(0.95, rule.confidence + 0.05);
			} else {
				rule.confidence = Math.max(0.1, rule.confidence - 0.03);
			}
		}
	}

	public addRule(rule: DynamicRule) {
		this.rules.push(rule);
	}

	public applyRules(task: RecommendTask, context: ContextInfo): Partial<RecommendTask> {
		const updates: Partial<RecommendTask> = {};

		for (const rule of this.rules.filter(r => r.confidence > 0.3)) {
			if (this.evaluateCondition(rule.condition, task, context)) {
				Object.assign(updates, this.executeAction(rule.action, task));
			}
		}

		return updates;
	}

	private evaluateCondition(condition: string, task: RecommendTask, context: ContextInfo): boolean {
		if (condition.includes('timeOfDay === "morning"')) {
			return context.timeOfDay === 'morning';
		}
		if (condition.includes('hasTag')) {
			const tagMatch = condition.match(/hasTag\(([^)]+)\)/);
			if (tagMatch) {
				return task.tagIds.includes(tagMatch[1]);
			}
		}
		return false;
	}

	private executeAction(action: string, task: RecommendTask): Partial<RecommendTask> {
		const updates: Partial<RecommendTask> = {};
		if (action.includes('alsoAddTag')) {
			const tagMatch = action.match(/alsoAddTag\(([^)]+)\)/);
			if (tagMatch && !task.tagIds.includes(tagMatch[1])) {
				updates.tagIds = [...task.tagIds, tagMatch[1]];
			}
		}
		return updates;
	}
}

export class HybridRecommendationEngine {
	private timeAnalyzer: TimeRelationAnalyzer;
	private periodicDetector: PeriodicTaskDetector;
	private behaviorPredictor: BehaviorPredictor;
	private ruleGenerator: DynamicRuleGenerator;
	private tasks: RecommendTask[];
	private tags: RecommendTag[];
	private config: AlgorithmConfig;

	constructor(tasks: RecommendTask[], tags: RecommendTag[], config: AlgorithmConfig) {
		this.tasks = tasks;
		this.tags = tags;
		this.config = config;
		this.timeAnalyzer = new TimeRelationAnalyzer(tasks);
		this.periodicDetector = new PeriodicTaskDetector(tasks);
		this.behaviorPredictor = new BehaviorPredictor(tasks);
		this.ruleGenerator = new DynamicRuleGenerator(tasks);
	}

	public generateContextInfo(currentTime: Date): ContextInfo {
		const hour = getHours(currentTime);
		let timeOfDay: ContextInfo["timeOfDay"] = 'morning';
		if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
		else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
		else if (hour >= 21 || hour < 6) timeOfDay = 'night';

		const dow = getDay(currentTime);
		const dayType: ContextInfo["dayType"] = (dow === 0 || dow === 6) ? 'weekend' : 'workday';

		const recentTasks = this.tasks.filter(t => {
			try {
				return differenceInDays(currentTime, parseISO(t.createdAt)) <= 30;
			} catch {
				return false;
			}
		});

		const upcomingDeadlines = this.tasks.filter(t => {
			if (!t.dueDate) return false;
			try {
				const due = parseISO(t.dueDate);
				const diff = differenceInDays(due, currentTime);
				return diff >= 0 && diff <= 7;
			} catch {
				return false;
			}
		});

		return {
			currentTime,
			currentDayOfWeek: dow,
			currentHour: hour,
			recentTasks,
			upcomingDeadlines,
			dayType,
			timeOfDay,
		};
	}

	public generateRecommendations(contextTime?: Date): {
		recommendations: Recommendation[];
		analysisMetadata: any;
	} {
		const context = this.generateContextInfo(contextTime || new Date());

		const timePatterns = this.timeAnalyzer.analyzeTimeRelations();
		const periodicPatterns = this.periodicDetector.detectPeriodicPatterns();
		const behaviorPatterns = this.behaviorPredictor.analyzeBehaviorPatterns();
		const dynamicRules = this.ruleGenerator.getRules();

		const recommendations: Recommendation[] = [];

		const historicalRecs = this.generateHistoricalRecommendations(context, timePatterns, periodicPatterns, behaviorPatterns);
		recommendations.push(...historicalRecs);

		const predictedRecs = this.generatePredictedRecommendations(context, periodicPatterns, behaviorPatterns);
		recommendations.push(...predictedRecs);

		const novelRecs = this.generateNovelRecommendations(context, behaviorPatterns);
		recommendations.push(...novelRecs);

		recommendations.sort((a, b) => b.confidence - a.confidence);
		const finalRecs = recommendations.slice(0, this.config.maxRecommendations);

		const predictedTasks = periodicPatterns.map(p => this.periodicDetector.generateNextOccurrence(p, context)).filter(Boolean) as PredictedTask[];

		return {
			recommendations: finalRecs,
			analysisMetadata: {
				timeRelationPatterns: timePatterns,
				periodicPatterns,
				behaviorPatterns,
				dynamicRules,
				predictedTasks,
				timestamp: new Date().toISOString(),
			},
		};
	}

	private generateHistoricalRecommendations(
		context: ContextInfo,
		timePatterns: any[],
		periodicPatterns: any[],
		behaviorPatterns: any
	): Recommendation[] {
		const recommendations: Recommendation[] = [];
		const uniqueTitles = new Map<string, RecommendTask>();

		for (const task of this.tasks) {
			if (!uniqueTitles.has(task.title)) {
				uniqueTitles.set(task.title, task);
			}
		}

		for (const task of uniqueTitles.values()) {
			const scores = this.calculateScores(task, context, timePatterns, periodicPatterns, behaviorPatterns);
			const confidence = this.calculateTotalScore(scores);

			if (confidence >= this.config.minConfidence) {
				const enhancedTask = this.enhanceTaskWithPredictions(task, context, behaviorPatterns);
				const reasons = this.generateReasons(scores);

				recommendations.push({
					task: {
						...enhancedTask,
						id: generateId(),
					},
					scores,
					confidence,
					reason: reasons.join('; '),
					recommendationType: 'historical',
				});
			}
		}

		return recommendations;
	}

	private generatePredictedRecommendations(
		context: ContextInfo,
		periodicPatterns: PeriodicTaskPattern[],
		behaviorPatterns: BehaviorPattern
	): Recommendation[] {
		const recommendations: Recommendation[] = [];

		for (const pattern of periodicPatterns) {
			const predicted = this.periodicDetector.generateNextOccurrence(pattern, context);
			if (predicted && predicted.confidence >= 0.5) {
				const task: RecommendTask = {
					id: generateId(),
					title: predicted.title,
					date: predicted.predictedDate,
					startTime: predicted.predictedStartTime,
					endTime: predicted.predictedEndTime,
					dueDate: predicted.predictedDueDate,
					isAllDay: false,
					tagIds: predicted.tagIds,
					duration: predicted.durationMinutes,
					createdAt: new Date().toISOString(),
				};

				const scores: FactorScores = {
					nameSimilarity: 0.5,
					timePattern: 0.6,
					tagCorrelation: 0.5,
					durationStats: 0.5,
					schedulingPattern: 0.6,
					dueDatePattern: 0.5,
					timeRelation: 0.7,
					behaviorPrediction: 0.8,
					periodicPattern: pattern.confidence,
					contextAdaptation: 0.6,
					total: 0.65,
				};

				recommendations.push({
					task,
					scores,
					confidence: predicted.confidence * 0.9,
					reason: `基于${pattern.frequency}周期性任务模式预测`,
					recommendationType: 'predicted',
				});
			}
		}

		return recommendations;
	}

	private generateNovelRecommendations(
		context: ContextInfo,
		behaviorPatterns: BehaviorPattern
	): Recommendation[] {
		const recommendations: Recommendation[] = [];

		if (Math.random() < this.config.explorationRate) {
			const existingTitles = new Set(this.tasks.map(t => t.title.toLowerCase()));
			const novelTemplates = [
				{ title: '阅读书籍', tags: ['tag-reading', 'tag-study'], duration: 45 },
				{ title: '户外散步', tags: ['tag-exercise', 'tag-rest'], duration: 30 },
				{ title: '整理房间', tags: ['tag-rest'], duration: 60 },
				{ title: '学习新技能', tags: ['tag-study', 'tag-creative'], duration: 90 },
			];

			for (const template of novelTemplates) {
				if (!existingTitles.has(template.title.toLowerCase())) {
					const predictedTimes = this.behaviorPredictor.predictTime(behaviorPatterns, context);
					const predictedDeadlines = this.behaviorPredictor.predictDeadline({ tagIds: template.tags }, context, behaviorPatterns);

					const task: RecommendTask = {
						id: generateId(),
						title: template.title,
						date: predictedDeadlines.date,
						startTime: predictedTimes.startTime,
						endTime: predictedTimes.endTime,
						dueDate: predictedDeadlines.dueDate,
						isAllDay: false,
						tagIds: template.tags,
						duration: template.duration,
						createdAt: new Date().toISOString(),
					};

					const scores: FactorScores = {
						nameSimilarity: 0.1,
						timePattern: 0.4,
						tagCorrelation: 0.4,
						durationStats: 0.3,
						schedulingPattern: 0.4,
						dueDatePattern: 0.4,
						timeRelation: 0.3,
						behaviorPrediction: 0.5,
						periodicPattern: 0.2,
						contextAdaptation: 0.5,
						total: 0.35,
					};

					recommendations.push({
						task,
						scores,
						confidence: 0.35,
						reason: '探索性推荐 - 基于上下文适配',
						isNovel: true,
						recommendationType: 'novel',
					});

					if (recommendations.length >= 2) break;
				}
			}
		}

		return recommendations;
	}

	private calculateScores(
		task: RecommendTask,
		context: ContextInfo,
		timePatterns: any[],
		periodicPatterns: any[],
		behaviorPatterns: any
	): FactorScores {
		const nameSimilarity = this.calculateNameSimilarity(task);
		const timePattern = this.calculateTimePatternScore(task, context);
		const tagCorrelation = this.calculateTagCorrelation(task);
		const durationStats = this.calculateDurationStats(task);
		const schedulingPattern = this.calculateSchedulingPattern(task);
		const dueDatePattern = this.calculateDueDatePattern(task);
		const timeRelation = this.timeAnalyzer.calculateTimeRelationScore(task, context, timePatterns);
		const behaviorPrediction = this.behaviorPredictor.calculateBehaviorPredictionScore(task, context, behaviorPatterns);
		const periodicPattern = this.periodicDetector.calculatePeriodicScore(task, periodicPatterns);
		const contextAdaptation = this.calculateContextAdaptation(task, context);

		const total =
			nameSimilarity * this.config.weights.nameSimilarity +
			timePattern * this.config.weights.timePattern +
			tagCorrelation * this.config.weights.tagCorrelation +
			durationStats * this.config.weights.durationStats +
			schedulingPattern * this.config.weights.schedulingPattern +
			dueDatePattern * this.config.weights.dueDatePattern +
			timeRelation * this.config.weights.timeRelation +
			behaviorPrediction * this.config.weights.behaviorPrediction +
			periodicPattern * this.config.weights.periodicPattern +
			contextAdaptation * this.config.weights.contextAdaptation;

		return {
			nameSimilarity: Math.round(nameSimilarity * 1000) / 1000,
			timePattern: Math.round(timePattern * 1000) / 1000,
			tagCorrelation: Math.round(tagCorrelation * 1000) / 1000,
			durationStats: Math.round(durationStats * 1000) / 1000,
			schedulingPattern: Math.round(schedulingPattern * 1000) / 1000,
			dueDatePattern: Math.round(dueDatePattern * 1000) / 1000,
			timeRelation: Math.round(timeRelation * 1000) / 1000,
			behaviorPrediction: Math.round(behaviorPrediction * 1000) / 1000,
			periodicPattern: Math.round(periodicPattern * 1000) / 1000,
			contextAdaptation: Math.round(contextAdaptation * 1000) / 1000,
			total: Math.round(total * 1000) / 1000,
		};
	}

	private calculateNameSimilarity(task: RecommendTask): number {
		const similarTasks = this.tasks.filter(t => 
			t.title.toLowerCase().includes(task.title.toLowerCase()) ||
			task.title.toLowerCase().includes(t.title.toLowerCase())
		);
		return Math.min(1, similarTasks.length / Math.max(this.tasks.length, 1));
	}

	private calculateTimePatternScore(task: RecommendTask, context: ContextInfo): number {
		if (!task.startTime) return 0.3;
		const taskHour = parseInt(task.startTime.split(':')[0]);
		const hourDiff = Math.abs(taskHour - context.currentHour);
		return Math.max(0, 1 - hourDiff / 6);
	}

	private calculateTagCorrelation(task: RecommendTask): number {
		if (task.tagIds.length === 0) return 0.3;

		let score = 0.3;
		for (const tag of task.tagIds) {
			const tagCount = this.tasks.filter(t => t.tagIds.includes(tag)).length;
			score += (tagCount / Math.max(this.tasks.length, 1)) * 0.2;
		}
		return Math.min(1, score);
	}

	private calculateDurationStats(task: RecommendTask): number {
		const similarDurationTasks = this.tasks.filter(t =>
			Math.abs(t.duration - task.duration) < 30);
		return Math.min(1, similarDurationTasks.length / Math.max(this.tasks.length, 10));
	}

	private calculateSchedulingPattern(task: RecommendTask): number {
		return 0.5;
	}

	private calculateDueDatePattern(task: RecommendTask): number {
		return 0.5;
	}

	private calculateContextAdaptation(task: RecommendTask, context: ContextInfo): number {
		let score = 0.5;

		if (task.tagIds.includes('tag-work') && context.dayType === 'workday') {
			score += 0.2;
		}
		if (task.tagIds.includes('tag-exercise') && context.timeOfDay === 'morning') {
			score += 0.2;
		}
		if (task.tagIds.includes('tag-rest') && context.timeOfDay === 'evening') {
			score += 0.2;
		}

		return Math.min(1, score);
	}

	private calculateTotalScore(scores: FactorScores): number {
		return scores.total;
	}

	private enhanceTaskWithPredictions(
		task: RecommendTask,
		context: ContextInfo,
		behaviorPatterns: BehaviorPattern
	): RecommendTask {
		const enhanced = { ...task };

		if (!enhanced.date) {
			enhanced.date = format(context.currentTime, 'yyyy-MM-dd');
		}

		if (!enhanced.startTime && !enhanced.isAllDay) {
			const times = this.behaviorPredictor.predictTime(behaviorPatterns, context);
			enhanced.startTime = times.startTime;
			enhanced.endTime = times.endTime;
		}

		if (!enhanced.dueDate) {
			const deadlines = this.behaviorPredictor.predictDeadline(task, context, behaviorPatterns);
			enhanced.dueDate = deadlines.dueDate;
		}

		return enhanced;
	}

	private generateReasons(scores: FactorScores): string[] {
		const reasons: string[] = [];
		if (scores.timeRelation > 0.5) reasons.push('时间关系模式匹配');
		if (scores.periodicPattern > 0.5) reasons.push('周期性任务模式');
		if (scores.behaviorPrediction > 0.5) reasons.push('行为模式预测');
		if (scores.contextAdaptation > 0.5) reasons.push('上下文适配良好');
		if (scores.tagCorrelation > 0.5) reasons.push('标签关联度高');
		if (reasons.length === 0) reasons.push('综合推荐');
		return reasons;
	}
}

export class EvaluationEngine {
	private feedbacks: FeedbackRecord[];

	constructor(feedbacks: FeedbackRecord[]) {
		this.feedbacks = feedbacks;
	}

	public calculateMetrics(): EvaluationMetrics {
		if (this.feedbacks.length === 0) {
			return {
				precision: 0,
				recall: 0,
				f1Score: 0,
				acceptanceRate: 0,
				taskCompletionRate: 0,
				averageConfidence: 0,
				noveltyScore: 0,
				adaptationSpeed: 0,
				trendAnalysis: { direction: 'stable', rate: 0 },
			};
		}

		const accepted = this.feedbacks.filter(f => f.accepted).length;
		const total = this.feedbacks.length;
		const acceptanceRate = accepted / total;

		const recentCount = Math.min(20, total);
		const recentFeedbacks = this.feedbacks.slice(-recentCount);
		const recentAccepted = recentFeedbacks.filter(f => f.accepted).length;
		const recentRate = recentAccepted / recentCount;

		const avgConfidence = this.feedbacks.reduce((sum, f) => sum + f.scores.total, 0) / total;

		const noveltyAcceptance = this.feedbacks.filter(f => f.scores.nameSimilarity < 0.3 && f.accepted).length;
		const noveltyTotal = this.feedbacks.filter(f => f.scores.nameSimilarity < 0.3).length;
		const noveltyScore = noveltyTotal > 0 ? noveltyAcceptance / noveltyTotal : 0;

		let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
		let trendRate = 0;

		if (total >= 10) {
			const firstHalf = this.feedbacks.slice(0, Math.floor(total / 2));
			const secondHalf = this.feedbacks.slice(Math.floor(total / 2));
			const firstRate = firstHalf.filter(f => f.accepted).length / firstHalf.length;
			const secondRate = secondHalf.filter(f => f.accepted).length / secondHalf.length;
			trendRate = secondRate - firstRate;
			if (trendRate > 0.1) trendDirection = 'improving';
			else if (trendRate < -0.1) trendDirection = 'declining';
		}

		return {
			precision: acceptanceRate,
			recall: acceptanceRate,
			f1Score: acceptanceRate,
			acceptanceRate,
			taskCompletionRate: acceptanceRate * 0.8,
			averageConfidence: avgConfidence,
			noveltyScore,
			adaptationSpeed: Math.abs(trendRate),
			trendAnalysis: {
				direction: trendDirection,
				rate: trendRate,
			},
		};
	}
}

export class SelfLearningMechanism {
	private config: AlgorithmConfig;
	private learningState: LearningState;

	constructor(config: AlgorithmConfig) {
		this.config = config;
		this.learningState = {
			weights: { ...config.weights },
			patternConfidence: {},
			ruleEffectiveness: {},
			userPreferenceDrift: 0,
			lastUpdate: new Date().toISOString(),
		};
	}

	public updateFromFeedback(feedback: FeedbackRecord): AlgorithmConfig {
		const lr = this.config.learningRate;
		const newWeights = { ...this.learningState.weights };

		const factors = [
			'nameSimilarity',
			'timePattern',
			'tagCorrelation',
			'durationStats',
			'schedulingPattern',
			'dueDatePattern',
			'timeRelation',
			'behaviorPrediction',
			'periodicPattern',
			'contextAdaptation',
		] as const;

		for (const factor of factors) {
			if (feedback.accepted) {
				newWeights[factor] += feedback.scores[factor] * lr * 0.5;
			} else {
				newWeights[factor] -= feedback.scores[factor] * lr * 0.3;
			}
			newWeights[factor] = Math.max(0.05, Math.min(0.2, newWeights[factor]));
		}

		const totalWeight = Object.values(newWeights).reduce((a, b) => a + b, 0);
		for (const factor of factors) {
			newWeights[factor] /= totalWeight;
		}

		this.learningState.weights = newWeights;
		this.learningState.lastUpdate = new Date().toISOString();

		return {
			...this.config,
			weights: newWeights,
		};
	}

	public getLearningState(): LearningState {
		return this.learningState;
	}

	public detectPreferenceDrift(recentFeedbacks: FeedbackRecord[]): number {
		if (recentFeedbacks.length < 10) return 0;

		const firstHalf = recentFeedbacks.slice(0, Math.floor(recentFeedbacks.length / 2));
		const secondHalf = recentFeedbacks.slice(Math.floor(recentFeedbacks.length / 2));

		const avgScoreFirst = firstHalf.reduce((sum, f) => sum + f.scores.total, 0) / firstHalf.length;
		const avgScoreSecond = secondHalf.reduce((sum, f) => sum + f.scores.total, 0) / secondHalf.length;

		const drift = Math.abs(avgScoreSecond - avgScoreFirst);
		this.learningState.userPreferenceDrift = drift;

		return drift;
	}
}
