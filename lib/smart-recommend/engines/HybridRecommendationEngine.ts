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

    const predictedRecs = this.generatePredictedRecommendations(context, periodicPatterns, behaviorPatterns);
    rawRecommendations.push(...predictedRecs);

    const novelRecs = this.generateNovelRecommendations(context, behaviorPatterns);
    rawRecommendations.push(...novelRecs);

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
    periodicPatterns: PeriodicTaskPattern[],
    _behaviorPatterns: BehaviorPattern
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
    _context: ContextInfo,
    _behaviorPatterns: BehaviorPattern
  ): Recommendation[] {
    // 不再生成探索性推荐，避免编造新标题
    return [];
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

  private calculateSchedulingPattern(_task: RecommendTask): number {
    return 0.5;
  }

  private calculateDueDatePattern(_task: RecommendTask): number {
    return 0.5;
  }

  private calculateContextAdaptation(task: RecommendTask, context: ContextInfo): number {
    let score = 0.5;

    // 从历史数据中学习标签在不同时间段的使用模式，而不是使用硬编码
    const tagTimePatterns: Record<string, { timeOfDay: Record<string, number>; dayType: Record<string, number> }> = {};

    // 收集统计数据
    for (const histTask of this.tasks) {
      for (const tagId of histTask.tagIds) {
        if (!tagTimePatterns[tagId]) {
          tagTimePatterns[tagId] = {
            timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
            dayType: { workday: 0, weekend: 0, holiday: 0 }
          };
        }

        // 获取该任务的上下文
        if (histTask.date) {
          try {
            const taskDate = parseISO(histTask.date);
            const taskHour = getHours(taskDate);
            const taskDayOfWeek = getDay(taskDate);

            // 确定时间段
            let timeOfDay = 'morning';
            if (taskHour >= 12 && taskHour < 17) timeOfDay = 'afternoon';
            else if (taskHour >= 17 && taskHour < 21) timeOfDay = 'evening';
            else if (taskHour >= 21 || taskHour < 6) timeOfDay = 'night';

            // 确定工作日/周末
            const isWeekend = taskDayOfWeek === 0 || taskDayOfWeek === 6;
            const dayType = isWeekend ? 'weekend' : 'workday';

            tagTimePatterns[tagId].timeOfDay[timeOfDay]++;
            tagTimePatterns[tagId].dayType[dayType]++;
          } catch {
            continue;
          }
        }
      }
    }

    // 根据统计数据给分
    for (const tagId of task.tagIds) {
      if (tagTimePatterns[tagId]) {
        const patterns = tagTimePatterns[tagId];
        const timeOfDayCounts = patterns.timeOfDay;
        const dayTypeCounts = patterns.dayType;

        // 时间段匹配得分
        const totalTimeOfDay = Object.values(timeOfDayCounts).reduce((a, b) => a + b, 0);
        if (totalTimeOfDay > 0) {
          const currentTimeOfDayRatio = timeOfDayCounts[context.timeOfDay] / totalTimeOfDay;
          score += currentTimeOfDayRatio * 0.15;
        }

        // 工作日/周末匹配得分
        const totalDayType = Object.values(dayTypeCounts).reduce((a, b) => a + b, 0);
        if (totalDayType > 0) {
          const currentDayTypeRatio = dayTypeCounts[context.dayType] / totalDayType;
          score += currentDayTypeRatio * 0.15;
        }
      }
    }

    return Math.min(1, score);
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

    return Array.from(deduplicated.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxRecommendations);
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

    const strongSignals = [
      recommendation.scores.periodicPattern >= 0.55,
      recommendation.scores.timeRelation >= 0.55,
      recommendation.scores.contextAdaptation >= 0.6,
      recommendation.scores.behaviorPrediction >= 0.6,
    ].filter(Boolean).length;

    if (strongSignals === 0 && recommendation.confidence < 0.5) {
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
      { key: "schedulingPattern", label: "调度模式" },
      { key: "dueDatePattern", label: "截止日期" },
      { key: "timeRelation", label: "时间关系" },
      { key: "behaviorPrediction", label: "行为预测" },
      { key: "periodicPattern", label: "周期模式" },
      { key: "contextAdaptation", label: "上下文适配" },
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
    if (scores.behaviorPrediction > 0.5) reasons.push('行为模式预测');
    if (scores.contextAdaptation > 0.5) reasons.push('上下文适配良好');
    if (scores.tagCorrelation > 0.5) reasons.push('标签关联度高');
    if (reasons.length === 0) reasons.push('综合推荐');
    return reasons;
  }
}
