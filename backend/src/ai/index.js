import { runMultachekPipeline } from "../../dist/ai/orchestrator.js";

export async function analyzeWithAI(input) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    return await runMultachekPipeline(input);
  } catch (e) {
    console.error("AI error:", e.message);
    return null;
  }
}
