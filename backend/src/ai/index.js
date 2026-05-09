import { costTracker } from "./costTracker.js";
import { logger } from "../config/logger.js";

const PIPELINE_MODEL = "gpt-4o-mini";

/**
 * OpenAI path: orquestador compilado en `dist/ai/*` (`npm run build:ai`).
 * Import dinámico para no romper el arranque cuando solo se usa el proveedor `javascript` sin artefacto dist.
 */
export async function analyzeWithAI(input) {
  if (!process.env.OPENAI_API_KEY?.trim()) return null;

  try {
    const { runMultachekPipeline } = await import(
      "../../dist/ai/orchestrator.js"
    );
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
    const msg = e?.message ?? String(e);
    const code = e?.code;
    if (
      code === "ERR_MODULE_NOT_FOUND" ||
      msg.includes("Cannot find module") ||
      msg.includes("Qualified path resolution failed")
    ) {
      logger.warn(
        {
          context: "analyzeWithAI",
          phase: "pipeline_missing_dist",
        },
        "OpenAI pipeline: falta dist/ai — ejecutá `npm run build:ai` en backend"
      );
      return null;
    }
    logger.error({
      context: "analyzeWithAI",
      error: msg,
      stack: e?.stack,
    });
    return null;
  }
}
