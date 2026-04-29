import { addDays, format, getDay, parseISO, differenceInDays } from "date-fns";
import type { RecommendTask, PeriodicTaskPattern, ContextInfo, PredictedTask } from "../types";

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
