import { getDay, parseISO, differenceInDays } from "date-fns";
import type { RecommendTask, TimeRelationPattern, ContextInfo } from "../types";

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

    for (const [, tagTasks] of Object.entries(groupedByTag)) {
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

  public calculateTimeRelationScore(
    task: RecommendTask,
    context: ContextInfo,
    patterns: TimeRelationPattern[]
  ): number {
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
