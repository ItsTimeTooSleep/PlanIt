import type {
  FeedbackRecord,
  EvaluationMetrics,
} from "../types";

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
        trendAnalysis: { direction: "stable", rate: 0 },
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

    const noveltyAcceptance = this.feedbacks.filter(
      f => f.scores.nameSimilarity < 0.3 && f.accepted
    ).length;
    const noveltyTotal = this.feedbacks.filter(f => f.scores.nameSimilarity < 0.3).length;
    const noveltyScore = noveltyTotal > 0 ? noveltyAcceptance / noveltyTotal : 0;

    let trendDirection: "improving" | "declining" | "stable" = "stable";
    let trendRate = 0;

    if (total >= 10) {
      const firstHalf = this.feedbacks.slice(0, Math.floor(total / 2));
      const secondHalf = this.feedbacks.slice(Math.floor(total / 2));
      const firstRate = firstHalf.filter(f => f.accepted).length / firstHalf.length;
      const secondRate = secondHalf.filter(f => f.accepted).length / secondHalf.length;
      trendRate = secondRate - firstRate;
      if (trendRate > 0.1) trendDirection = "improving";
      else if (trendRate < -0.1) trendDirection = "declining";
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
