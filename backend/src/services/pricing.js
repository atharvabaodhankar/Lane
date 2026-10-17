import { getTier, getBaselineTier } from '../config/tiers.js';

/**
 * Calculates exact costs and savings based on token usage and model tier.
 * Costs are returned as fixed-precision strings to avoid floating point drift.
 */
export function calculateCost(lane, inputTokens = 0, outputTokens = 0) {
  const tier = getTier(lane);
  const baseline = getBaselineTier();

  const actualCostNum =
    (inputTokens * tier.inputPer1M + outputTokens * tier.outputPer1M) / 1_000_000;

  const baselineCostNum =
    (inputTokens * baseline.inputPer1M + outputTokens * baseline.outputPer1M) / 1_000_000;

  const savingsNum = Math.max(0, baselineCostNum - actualCostNum);

  return {
    cost: actualCostNum.toFixed(7),
    baselineCost: baselineCostNum.toFixed(7),
    savings: savingsNum.toFixed(7),
    costNum: actualCostNum,
    baselineCostNum: baselineCostNum,
    savingsNum: savingsNum
  };
}

/**
 * Calculate cost for a cache hit (actual cost is 0, full baseline is saved)
 */
export function calculateCacheHitCost(inputTokens = 0, outputTokens = 0) {
  const baseline = getBaselineTier();
  const baselineCostNum =
    (inputTokens * baseline.inputPer1M + outputTokens * baseline.outputPer1M) / 1_000_000;

  return {
    cost: "0.0000000",
    baselineCost: baselineCostNum.toFixed(7),
    savings: baselineCostNum.toFixed(7),
    costNum: 0,
    baselineCostNum: baselineCostNum,
    savingsNum: baselineCostNum
  };
}
