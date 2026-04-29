
/**
 * Smart Recommend 模块
 * 智能任务推荐系统
 *
 * @example
 * ```typescript
 * import {
 *   HybridRecommendationEngine,
 *   EvaluationEngine,
 *   SelfLearningMechanism,
 *   loadState,
 *   saveState,
 * } from '@/lib/smart-recommend';
 *
 * // 加载状态
 * const state = loadState();
 *
 * // 生成推荐
 * const engine = new HybridRecommendationEngine(state.tasks, state.tags, state.config);
 * const { recommendations, analysisMetadata, log } = engine.generateRecommendations();
 *
 * // 评估系统
 * const evaluator = new EvaluationEngine(state.feedbacks);
 * const metrics = evaluator.calculateMetrics();
 * ```
 */

// 类型导出
export * from "./types";

// 常量导出
export * from "./constants";

// 工具函数导出
export * from "./utils";

// 分析器导出
export * from "./analyzers";

// 引擎导出
export * from "./engines";

// 评估和学习模块导出
export * from "./evaluation";

// 状态管理导出
export * from "./store";
