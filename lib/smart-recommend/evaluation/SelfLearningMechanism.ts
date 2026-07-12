import type {
  AlgorithmConfig,
  FeedbackRecord,
  LearningState,
  FactorWeights,
} from "../types";
import { DEFAULT_CONFIG } from "../constants";

export class SelfLearningMechanism {
  private config: AlgorithmConfig;
  private learningState: LearningState;

  constructor(config: AlgorithmConfig = DEFAULT_CONFIG) {
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

    const factors: Array<keyof FactorWeights> = [
      "nameSimilarity",
      "timePattern",
      "tagCorrelation",
      "durationStats",
      "timeRelation",
      "periodicPattern",
      "contextMatch",
      "sequenceMatch",
      "frequencyScore",
    ];

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
