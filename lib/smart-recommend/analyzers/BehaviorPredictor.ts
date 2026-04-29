import { addDays, format, getHours, parseISO, differenceInDays } from "date-fns";
import type { RecommendTask, BehaviorPattern, ContextInfo } from "../types";

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
        const maxFrequency = behavior.taskCreationWindows.length > 0 ? 
          Math.max(...behavior.taskCreationWindows.map(w => w.frequency)) : 1;
        score += 0.3 * (matchingWindow.frequency / Math.max(maxFrequency, 1));
      }
    }

    if (task.tagIds.length > 0) {
      const tagKey = task.tagIds.sort().join(',');
      const matchingCombo = behavior.tagCombinations.find(c => c.tags.sort().join(',') === tagKey);
      if (matchingCombo) {
        const maxFrequency = behavior.tagCombinations.length > 0 ? 
          Math.max(...behavior.tagCombinations.map(c => c.frequency)) : 1;
        score += 0.4 * (matchingCombo.frequency / Math.max(maxFrequency, 1));
      }
    }

    return Math.min(1, score);
  }
}
