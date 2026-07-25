import { addDays, format, getHours, parseISO, differenceInDays } from "date-fns";
import type { RecommendTask, BehaviorPattern, ContextInfo } from "../types";

interface TransitionMatrix {
  transitions: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
}

export class BehaviorPredictor {
  private tasks: RecommendTask[];
  private transitionMatrix: TransitionMatrix;

  constructor(tasks: RecommendTask[]) {
    this.tasks = tasks;
    this.transitionMatrix = this.buildTransitionMatrix();
  }

  public analyzeBehaviorPatterns(): BehaviorPattern {
    return {
      taskCreationWindows: this.analyzeCreationWindows(),
      deadlineLeadTimes: this.analyzeDeadlineLeadTimes(),
      taskSequences: this.analyzeTaskSequences(),
      tagCombinations: this.analyzeTagCombinations(),
    };
  }

  private buildTransitionMatrix(): TransitionMatrix {
    const transitions: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};

    const sortedTasks = [...this.tasks]
      .filter(t => t.createdAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (let i = 1; i < sortedTasks.length; i++) {
      const prevTask = sortedTasks[i - 1];
      const currTask = sortedTasks[i];

      try {
        const timeDiff = differenceInDays(parseISO(currTask.createdAt), parseISO(prevTask.createdAt));
        if (timeDiff > 3) continue;
      } catch {
        continue;
      }

      for (const prevTag of prevTask.tagIds) {
        for (const currTag of currTask.tagIds) {
          if (!transitions[prevTag]) transitions[prevTag] = {};
          transitions[prevTag][currTag] = (transitions[prevTag][currTag] || 0) + 1;
          rowTotals[prevTag] = (rowTotals[prevTag] || 0) + 1;
        }
      }
    }

    return { transitions, rowTotals };
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
          } catch {
            // 日期解析失败时跳过该任务
          }
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
    const { transitions, rowTotals } = this.transitionMatrix;
    const sequences: Array<{ sequence: string[]; frequency: number }> = [];

    for (const [fromTag, toTags] of Object.entries(transitions)) {
      for (const [toTag, count] of Object.entries(toTags)) {
        if (count >= 2) {
          sequences.push({
            sequence: [fromTag, toTag],
            frequency: count / Math.max(rowTotals[fromTag], 1),
          });
        }
      }
    }

    return sequences.sort((a, b) => b.frequency - a.frequency).slice(0, 20);
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

  public calculateSequenceScore(task: RecommendTask, context: ContextInfo, _behavior: BehaviorPattern): number {
    if (task.tagIds.length === 0 || context.recentTasks.length === 0) return 0.1;

    const { transitions, rowTotals } = this.transitionMatrix;
    const recentTags = this.getRecentTags(context);

    if (recentTags.length === 0) return 0.1;

    let totalProbability = 0;
    let matchCount = 0;
    const allTags = new Set(Object.keys(rowTotals));
    const numTags = Math.max(allTags.size, 1);

    for (const recentTag of recentTags) {
      const rowTotal = rowTotals[recentTag];
      if (!rowTotal) continue;

      for (const candidateTag of task.tagIds) {
        const count = transitions[recentTag]?.[candidateTag] || 0;
        const probability = (count + 1) / (rowTotal + numTags);
        totalProbability += probability;
        matchCount++;
      }
    }

    if (matchCount === 0) return 0.1;

    return Math.min(1, totalProbability / matchCount);
  }

  private getRecentTags(context: ContextInfo): string[] {
    const tagSet = new Set<string>();
    for (const task of context.recentTasks) {
      for (const tagId of task.tagIds) {
        tagSet.add(tagId);
      }
    }
    return Array.from(tagSet);
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
}
