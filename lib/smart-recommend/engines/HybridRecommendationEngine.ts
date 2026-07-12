import { addDays, format, getDay, getHours, isSameDay, parseISO, differenceInDays } from "date-fns";
import { generateId } from "@/lib/task-utils";
import type {
  AlgorithmConfig,
  AnalysisMetadata,
  DecisionLog,
  FactorDetail,
  RecommendTask,
  RecommendTag,
  ContextInfo,
  Recommendation,
  FactorScores,
  TimeRelationPattern,
  PeriodicTaskPattern,
  BehaviorPattern,
  PredictedTask
} from "../types";
import { TimeRelationAnalyzer } from "../analyzers/TimeRelationAnalyzer";
import { PeriodicTaskDetector } from "../analyzers/PeriodicTaskDetector";
import { BehaviorPredictor } from "../analyzers/BehaviorPredictor";
import { DynamicRuleGenerator } from "./DynamicRuleGenerator";
import { calculateNameSimilarityScore } from "../utils/string";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
type DayType = "workday" | "weekend" | "holiday";

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
    const timeOfDay = this.getTimeOfDay(hour);
    const dow = getDay(currentTime);
    const dayType: DayType = (dow === 0 || dow === 6) ? 'weekend' : 'workday';

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
    analysisMetadata: AnalysisMetadata;
    log: DecisionLog;
  } {
    const context = this.generateContextInfo(contextTime || new Date());

    const timePatterns = this.timeAnalyzer.analyzeTimeRelations();
    const periodicPatterns = this.periodicDetector.detectPeriodicPatterns();
    const behaviorPatterns = this.behaviorPredictor.analyzeBehaviorPatterns();
    const dynamicRules = this.ruleGenerator.getRules();

    const rawRecommendations: Recommendation[] = [];

    const historicalRecs = this.generateHistoricalRecommendations(context, timePatterns, periodicPatterns, behaviorPatterns);
    rawRecommendations.push(...historicalRecs);

    const predictedRecs = this.generatePredictedRecommendations(context, timePatterns, periodicPatterns, behaviorPatterns);
    rawRecommendations.push(...predictedRecs);

    const recommendations = this.postProcessRecommendations(rawRecommendations, context);

    const predictedTasks = periodicPatterns.map(p => this.periodicDetector.generateNextOccurrence(p, context)).filter(Boolean) as PredictedTask[];
    const analysisMetadata: AnalysisMetadata = {
      timeRelationPatterns: timePatterns,
      periodicPatterns,
      behaviorPatterns,
      dynamicRules,
      predictedTasks,
      timestamp: new Date().toISOString(),
    };

    return {
      recommendations,
      analysisMetadata,
      log: this.buildDecisionLog(context, recommendations, analysisMetadata),
    };
  }

  private generateHistoricalRecommendations(
    context: ContextInfo,
    timePatterns: TimeRelationPattern[],
    periodicPatterns: PeriodicTaskPattern[],
    behaviorPatterns: BehaviorPattern
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const uniqueTitles = new Map<string, RecommendTask>();

    for (const task of this.tasks) {
      const normalizedTitle = this.normalizeTitle(task.title);
      const existingTask = uniqueTitles.get(normalizedTitle);
      if (!existingTask || this.getTaskRecencyValue(task) > this.getTaskRecencyValue(existingTask)) {
        uniqueTitles.set(normalizedTitle, task);
      }
    }

    for (const task of uniqueTitles.values()) {
      const scores = this.calculateScores(task, context, timePatterns, periodicPatterns, behaviorPatterns);
      const enhancedTask = this.enhanceTaskWithPredictions(task, context, behaviorPatterns, periodicPatterns);
      const duplicatePenalty = this.calculateDuplicatePenalty(enhancedTask);
      const confidence = Math.round(this.calculateTotalScore(scores) * duplicatePenalty * 1000) / 1000;

      if (confidence >= this.config.minConfidence) {
        const reasons = this.generateReasons(scores);
        if (duplicatePenalty < 1) {
          reasons.push("已对同标题近重复时间冲突降权");
        }

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
    timePatterns: TimeRelationPattern[],
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

        const scores = this.calculateScores(task, context, timePatterns, periodicPatterns, behaviorPatterns);
        const confidence = Math.round(scores.total * pattern.confidence * 1000) / 1000;

        recommendations.push({
          task,
          scores,
          confidence,
          reason: `基于${pattern.frequency}周期性任务模式预测`,
          recommendationType: 'predicted',
        });
      }
    }

    return recommendations;
  }

  private calculateScores(
    task: RecommendTask,
    context: ContextInfo,
    timePatterns: TimeRelationPattern[],
    periodicPatterns: PeriodicTaskPattern[],
    behaviorPatterns: BehaviorPattern
  ): FactorScores {
    const nameSimilarity = this.calculateNameSimilarity(task);
    const timePattern = this.calculateTimePatternScore(task, context);
    const tagCorrelation = this.calculateTagCorrelation(task);
    const durationStats = this.calculateDurationStats(task);
    const timeRelation = this.timeAnalyzer.calculateTimeRelationScore(task, context, timePatterns);
    const periodicPattern = this.periodicDetector.calculatePeriodicScore(task, periodicPatterns);
    const contextMatch = this.calculateContextMatch(task, context);
    const sequenceMatch = this.behaviorPredictor.calculateSequenceScore(task, context, behaviorPatterns);
    const frequencyScore = this.calculateFrequencyScore(task);

    const total =
      nameSimilarity * this.config.weights.nameSimilarity +
      timePattern * this.config.weights.timePattern +
      tagCorrelation * this.config.weights.tagCorrelation +
      durationStats * this.config.weights.durationStats +
      timeRelation * this.config.weights.timeRelation +
      periodicPattern * this.config.weights.periodicPattern +
      contextMatch * this.config.weights.contextMatch +
      sequenceMatch * this.config.weights.sequenceMatch +
      frequencyScore * this.config.weights.frequencyScore;

    const round3 = (v: number) => Math.round(v * 1000) / 1000;

    return {
      nameSimilarity: round3(nameSimilarity),
      timePattern: round3(timePattern),
      tagCorrelation: round3(tagCorrelation),
      durationStats: round3(durationStats),
      timeRelation: round3(timeRelation),
      periodicPattern: round3(periodicPattern),
      contextMatch: round3(contextMatch),
      sequenceMatch: round3(sequenceMatch),
      frequencyScore: round3(frequencyScore),
      total: round3(total),
    };
  }

  private calculateFrequencyScore(task: RecommendTask): number {
    const normalizedTitle = this.normalizeTitle(task.title);
    const count = this.tasks.filter(t => this.normalizeTitle(t.title) === normalizedTitle).length;
    const maxCount = Math.max(
      ...Array.from(new Set(this.tasks.map(t => this.normalizeTitle(t.title)))).map(title =>
        this.tasks.filter(t => this.normalizeTitle(t.title) === title).length
      ),
      1
    );
    return count / maxCount;
  }

  private calculateNameSimilarity(task: RecommendTask): number {
    if (this.tasks.length === 0) return 0.3;
    let totalSimilarity = 0;
    for (const t of this.tasks) {
      if (t.id === task.id) continue;
      totalSimilarity += calculateNameSimilarityScore(task.title, t.title);
    }
    return Math.min(1, totalSimilarity / Math.max(this.tasks.length - 1, 1));
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

  private calculateContextMatch(task: RecommendTask, context: ContextInfo): number {
    if (task.tagIds.length === 0 || this.tasks.length === 0) return 0.3;

    const contextKey = `${context.timeOfDay}:${context.dayType}`;
    const contextTagCounts: Record<string, number> = {};
    const tagTotalCounts: Record<string, number> = {};

    for (const histTask of this.tasks) {
      if (!histTask.date) continue;
      try {
        const taskDate = parseISO(histTask.date);
        const taskHour = getHours(taskDate);
        const taskTimeOfDay = this.getTimeOfDay(taskHour);
        const taskDow = getDay(taskDate);
        const taskDayType: DayType = (taskDow === 0 || taskDow === 6) ? 'weekend' : 'workday';
        const taskContextKey = `${taskTimeOfDay}:${taskDayType}`;

        for (const tagId of histTask.tagIds) {
          tagTotalCounts[tagId] = (tagTotalCounts[tagId] || 0) + 1;
          if (taskContextKey === contextKey) {
            const tagContextKey = `${contextKey}:${tagId}`;
            contextTagCounts[tagContextKey] = (contextTagCounts[tagContextKey] || 0) + 1;
          }
        }
      } catch {
        continue;
      }
    }

    let score = 0;
    const numContexts = 8;
    for (const tagId of task.tagIds) {
      const tagContextKey = `${contextKey}:${tagId}`;
      const countInContext = contextTagCounts[tagContextKey] || 0;
      const totalCount = tagTotalCounts[tagId] || 0;
      const probability = (countInContext + 1) / (totalCount + numContexts);
      score += probability;
    }

    return Math.min(1, score / Math.max(task.tagIds.length, 1));
  }

  private calculateTotalScore(scores: FactorScores): number {
    return scores.total;
  }

  private enhanceTaskWithPredictions(
    task: RecommendTask,
    context: ContextInfo,
    behaviorPatterns: BehaviorPattern,
    periodicPatterns: PeriodicTaskPattern[]
  ): RecommendTask {
    const enhanced = {
      ...task,
      createdAt: context.currentTime.toISOString(),
    };
    const periodicPrediction = this.findPeriodicPrediction(task, periodicPatterns, context);
    const historicalLeadDays = this.calculateCreateToPlanLeadDays(task);
    const planToDueLeadDays = this.calculatePlanToDueLeadDays(task);
    const inferredDate = periodicPrediction?.predictedDate ?? format(addDays(context.currentTime, historicalLeadDays), 'yyyy-MM-dd');

    enhanced.date = inferredDate;

    if (periodicPrediction?.predictedStartTime) {
      enhanced.startTime = periodicPrediction.predictedStartTime;
      enhanced.endTime = this.calculateEndTime(periodicPrediction.predictedStartTime, enhanced.duration);
    } else if (!enhanced.startTime && !enhanced.isAllDay) {
      const times = this.behaviorPredictor.predictTime(behaviorPatterns, context);
      enhanced.startTime = times.startTime;
      enhanced.endTime = times.endTime;
    }

    if (planToDueLeadDays !== null) {
      enhanced.dueDate = format(addDays(parseISO(enhanced.date), planToDueLeadDays), 'yyyy-MM-dd');
    } else if (!enhanced.dueDate || enhanced.dueDate < enhanced.date) {
      const deadlines = this.behaviorPredictor.predictDeadline(task, context, behaviorPatterns);
      enhanced.dueDate = deadlines.dueDate;
    }

    this.ensureFutureSlot(enhanced, context);

    return enhanced;
  }

  private postProcessRecommendations(recommendations: Recommendation[], context: ContextInfo): Recommendation[] {
    const deduplicated = new Map<string, Recommendation>();

    for (const recommendation of recommendations) {
      if (!this.isRecommendationPlausible(recommendation, context)) {
        continue;
      }

      const key = this.getRecommendationKey(recommendation);
      const existing = deduplicated.get(key);
      if (!existing || recommendation.confidence > existing.confidence) {
        deduplicated.set(key, recommendation);
      }
    }

    const sorted = Array.from(deduplicated.values())
      .sort((a, b) => b.confidence - a.confidence);

    return this.applyMMR(sorted, this.config.diversityLambda);
  }

  private applyMMR(candidates: Recommendation[], lambda: number): Recommendation[] {
    if (candidates.length === 0 || lambda <= 0) {
      return candidates.slice(0, this.config.maxRecommendations);
    }

    const selected: Recommendation[] = [candidates[0]];
    const remaining = candidates.slice(1);

    while (selected.length < this.config.maxRecommendations && remaining.length > 0) {
      let bestIdx = -1;
      let bestMMR = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = candidate.confidence;

        let maxSimilarity = 0;
        for (const sel of selected) {
          const sim = this.calculateTaskSimilarity(candidate, sel);
          if (sim > maxSimilarity) maxSimilarity = sim;
        }

        const mmr = lambda * relevance - (1 - lambda) * maxSimilarity;
        if (mmr > bestMMR) {
          bestMMR = mmr;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        selected.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      } else {
        break;
      }
    }

    return selected;
  }

  private calculateTaskSimilarity(a: Recommendation, b: Recommendation): number {
    const tagsA = new Set(a.task.tagIds);
    const tagsB = new Set(b.task.tagIds);
    const intersection = new Set([...tagsA].filter(t => tagsB.has(t)));
    const union = new Set([...tagsA, ...tagsB]);

    const jaccard = union.size === 0 ? 0 : intersection.size / union.size;

    const titleSim = calculateNameSimilarityScore(a.task.title, b.task.title);

    return jaccard * 0.6 + titleSim * 0.4;
  }

  private isRecommendationPlausible(recommendation: Recommendation, context: ContextInfo): boolean {
    const minimumConfidence = Math.max(this.config.minConfidence, 0.35);
    if (recommendation.confidence < minimumConfidence) {
      return false;
    }

    if (!recommendation.task.date) {
      return false;
    }

    if (this.hasExactDuplicateScheduledTask(recommendation.task)) {
      return false;
    }

    const hasStrongSignal =
      recommendation.scores.periodicPattern >= 0.5 ||
      recommendation.scores.sequenceMatch >= 0.5;

    if (!hasStrongSignal && recommendation.confidence < 0.5) {
      return false;
    }

    if (!hasStrongSignal && recommendation.scores.frequencyScore < 0.1) {
      return false;
    }

    if (
      recommendation.task.startTime &&
      this.isTaskScheduledInPast(recommendation.task, context) &&
      recommendation.recommendationType !== "predicted"
    ) {
      return false;
    }

    return true;
  }

  private buildDecisionLog(
    context: ContextInfo,
    recommendations: Recommendation[],
    analysisMetadata: AnalysisMetadata
  ): DecisionLog {
    const topRecommendation = recommendations[0];

    return {
      id: generateId(),
      timestamp: new Date().toISOString(),
      contextTime: context.currentTime.toISOString(),
      factorDetails: topRecommendation ? this.createFactorDetails(topRecommendation.scores) : [],
      recommendations,
      selectedIndex: null,
      analysisMetadata,
    };
  }

  private createFactorDetails(scores: FactorScores): FactorDetail[] {
    const factorLabels: Array<{ key: keyof Omit<FactorScores, "total">; label: string }> = [
      { key: "nameSimilarity", label: "名称语义" },
      { key: "timePattern", label: "时间模式" },
      { key: "tagCorrelation", label: "标签关联" },
      { key: "durationStats", label: "时长统计" },
      { key: "timeRelation", label: "时间关系" },
      { key: "periodicPattern", label: "周期模式" },
      { key: "contextMatch", label: "情境匹配" },
      { key: "sequenceMatch", label: "序列预测" },
      { key: "frequencyScore", label: "频率因子" },
    ];

    return factorLabels.map(({ key, label }) => ({
      factor: label,
      weight: this.config.weights[key],
      rawScore: scores[key],
      weightedScore: Math.round(scores[key] * this.config.weights[key] * 1000) / 1000,
      description: `${label}得分`,
    }));
  }

  private normalizeTitle(title: string): string {
    return title.trim().toLowerCase().replace(/\s+/g, " ");
  }

  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 6) return 'night';
    return 'morning';
  }

  private getTaskRecencyValue(task: RecommendTask): number {
    const candidates = [task.date, task.createdAt].filter(Boolean) as string[];
    for (const value of candidates) {
      try {
        return parseISO(value).getTime();
      } catch {
        continue;
      }
    }
    return 0;
  }

  private calculateCreateToPlanLeadDays(task: RecommendTask): number {
    if (!task.date) {
      return 0;
    }

    try {
      const leadDays = differenceInDays(parseISO(task.date), parseISO(task.createdAt));
      return Math.max(0, leadDays);
    } catch {
      return 0;
    }
  }

  private calculatePlanToDueLeadDays(task: RecommendTask): number | null {
    if (!task.date || !task.dueDate) {
      return null;
    }

    try {
      const leadDays = differenceInDays(parseISO(task.dueDate), parseISO(task.date));
      return leadDays >= 0 ? leadDays : null;
    } catch {
      return null;
    }
  }

  private findPeriodicPrediction(
    task: RecommendTask,
    periodicPatterns: PeriodicTaskPattern[],
    context: ContextInfo
  ): PredictedTask | null {
    const baseTitle = this.normalizeTitle(task.title);
    const pattern = periodicPatterns.find(item => item.titlePattern === baseTitle);
    return pattern ? this.periodicDetector.generateNextOccurrence(pattern, context) : null;
  }

  private calculateDuplicatePenalty(task: RecommendTask): number {
    const normalizedTitle = this.normalizeTitle(task.title);
    let penalty = 1;

    for (const existingTask of this.tasks) {
      if (this.normalizeTitle(existingTask.title) !== normalizedTitle) {
        continue;
      }

      if (this.isExactTimeCollision(existingTask, task)) {
        return 0;
      }

      if (existingTask.date === task.date) {
        penalty = Math.min(penalty, 0.6);
      }
    }

    return penalty;
  }

  private hasExactDuplicateScheduledTask(task: RecommendTask): boolean {
    return this.tasks.some(existingTask =>
      this.normalizeTitle(existingTask.title) === this.normalizeTitle(task.title) &&
      this.isExactTimeCollision(existingTask, task)
    );
  }

  private isExactTimeCollision(left: RecommendTask, right: RecommendTask): boolean {
    if (!left.date || !right.date || left.date !== right.date) {
      return false;
    }

    if (left.isAllDay && right.isAllDay) {
      return true;
    }

    return Boolean(left.startTime && right.startTime && left.startTime === right.startTime);
  }

  private getRecommendationKey(recommendation: Recommendation): string {
    const { task } = recommendation;
    return [
      this.normalizeTitle(task.title),
      task.date ?? "",
      task.startTime ?? "",
      recommendation.recommendationType ?? "",
    ].join("|");
  }

  private ensureFutureSlot(task: RecommendTask, context: ContextInfo) {
    if (!task.date || !task.startTime) {
      return;
    }

    try {
      const [hours, minutes] = task.startTime.split(":").map(Number);
      const scheduledDate = parseISO(task.date);
      scheduledDate.setHours(hours, minutes || 0, 0, 0);

      if (isSameDay(scheduledDate, context.currentTime) && scheduledDate <= context.currentTime) {
        task.date = format(addDays(scheduledDate, 1), "yyyy-MM-dd");
        if (task.dueDate && task.dueDate < task.date) {
          task.dueDate = task.date;
        }
      }
    } catch {
      // ignore invalid historical time fields
    }
  }

  private isTaskScheduledInPast(task: RecommendTask, context: ContextInfo): boolean {
    if (!task.date || !task.startTime) {
      return false;
    }

    try {
      const [hours, minutes] = task.startTime.split(":").map(Number);
      const scheduledDate = parseISO(task.date);
      scheduledDate.setHours(hours, minutes || 0, 0, 0);
      return scheduledDate < context.currentTime;
    } catch {
      return false;
    }
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + Math.max(durationMinutes, 30);
    const endHour = Math.min(Math.floor(totalMinutes / 60), 23);
    const endMinute = totalMinutes % 60;
    return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
  }

  private generateReasons(scores: FactorScores): string[] {
    const reasons: string[] = [];
    if (scores.timeRelation > 0.5) reasons.push('时间关系模式匹配');
    if (scores.periodicPattern > 0.5) reasons.push('周期性任务模式');
    if (scores.sequenceMatch > 0.5) reasons.push('序列模式预测');
    if (scores.contextMatch > 0.5) reasons.push('情境匹配度高');
    if (scores.tagCorrelation > 0.5) reasons.push('标签关联度高');
    if (reasons.length === 0) reasons.push('综合推荐');
    return reasons;
  }
}
