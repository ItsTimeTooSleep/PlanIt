import { generateId } from "@/lib/task-utils";
import type { RecommendTask, DynamicRule, ContextInfo } from "../types";

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
