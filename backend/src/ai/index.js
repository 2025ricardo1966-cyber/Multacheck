import { runMultachekPipeline } from "../../dist/ai/orchestrator.js";
import { costTracker } from "./costTracker.js";
import { logger } from "../config/logger.js";

const PIPELINE_MODEL = "gpt-4o-mini";

export async function analyzeWithAI(input) {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const result = await runMultachekPipeline(input);

    const usage = result._usage;
    if (
      usage &&
      typeof usage.prompt_tokens === "number" &&
      typeof usage.completion_tokens === "number"
    ) {
      const cost = costTracker.trackCall(
        PIPELINE_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens
      );
      logger.info({
        type: "ai_cost",
        model: PIPELINE_MODEL,
        cost_usd: Number(cost.toFixed(6)),
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
      });
    }

    return result;
  } catch (e) {
    logger.error({ context: "analyzeWithAI", error: e.message, stack: e.stack });
    return null;
  }
}
