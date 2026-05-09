import { logger } from "../config/logger.js";

const COSTS = {
  "gpt-4o-mini": {
    input: 0.15 / 1_000_000,
    output: 0.6 / 1_000_000,
  },
};

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

class CostTracker {
  constructor() {
    this.dailyCost = 0;
    this.monthlyCost = 0;
    this.callCount = 0;
    this.lastResetDay = new Date();
    this.lastResetMonth = new Date();
  }

  trackCall(model, inputTokens, outputTokens) {
    const cost = COSTS[model];
    if (!cost) return 0;

    const input = Number(inputTokens) || 0;
    const output = Number(outputTokens) || 0;
    const totalCost = input * cost.input + output * cost.output;

    const now = new Date();

    if (dayKey(now) !== dayKey(this.lastResetDay)) {
      this.dailyCost = 0;
      this.lastResetDay = now;
    }

    if (monthKey(now) !== monthKey(this.lastResetMonth)) {
      this.monthlyCost = 0;
      this.lastResetMonth = now;
    }

    this.dailyCost += totalCost;
    this.monthlyCost += totalCost;
    this.callCount++;

    if (this.dailyCost > 5.0) {
      logger.error({
        context: "ai_budget",
        msg: "DAILY_AI_BUDGET_EXCEEDED",
        dailyUsd: Number(this.dailyCost.toFixed(4)),
      });
    }

    return totalCost;
  }

  getStats() {
    const calls = this.callCount;
    return {
      daily: this.dailyCost.toFixed(4),
      monthly: this.monthlyCost.toFixed(2),
      calls,
      avgPerCall:
        calls > 0 ? (this.monthlyCost / calls).toFixed(4) : "0.0000",
    };
  }
}

export const costTracker = new CostTracker();
