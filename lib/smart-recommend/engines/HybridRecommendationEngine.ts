import { addDays, format, getDay, getHours, parseISO, differenceInDays } from "date-fns";
import { generateId } from "@/lib/task-utils";
import type {
  AlgorithmConfig,
  RecommendTask,
  RecommendTag,
  ContextInfo,
  Recommendation,
  FactorScores,
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
    analysisMetadata: any;
    log: any;
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
      log: {},
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
