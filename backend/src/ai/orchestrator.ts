import "dotenv/config";
import OpenAI from "openai";
import { SIGNAL_EXTRACTOR_PROMPT_V1 } from "./signalExtractor.prompt.js";
import { NORMALIZATION_PROMPT_V1 } from "./normalization.prompt.js";
import { RULE_ENGINE_PROMPT_V1 } from "./ruleEngine.prompt.js";
import { ERROR_HANDLER_PROMPT_V1 } from "./errorHandler.prompt.js";

const PIPELINE_MODEL = "gpt-4o-mini";
const PIPELINE_TEMPERATURE = 0.2;

type PipelineInput = unknown;

export type SignalsJson = {
  case_id: string;
  signals: Array<{ type: string; value: number; confidence: number }>;
  global_confidence: number;
  data_quality_flags: string[];
};

export type NormalizationPipelineInput = {
  raw: PipelineInput;
  signals: SignalsJson;
};

export type CanonicalInfractionJson = {
  case_id: string;
  source: { channel: string; origin: string };
  jurisdiction: {
    country: string;
    region: string | null;
    city: string | null;
    confidence: number;
  };
  violation: { type: string; raw_type: string; confidence: number };
  temporal: {
    event_date: string;
    detection_date: string | null;
    confidence: number;
  };
  financial: {
    amount: number;
    currency: string;
    normalized_usd: number | null;
    confidence: number;
  };
  evidence: unknown[];
  entity_context: { vehicle_id: string | null; plate: string | null };
  quality: {
    completeness: number;
    consistency: number;
    overall_confidence: number;
  };
};

export type EvaluationJson = {
  case_id: string;
  final_score: number;
  decision: "invalid_fine" | "questionable" | "likely_valid_fine";
  risk_profile: {
    legal_risk: number;
    economic_risk: number;
    appeal_success_probability: number;
  };
  rules_applied: Array<{
    rule_id: string;
    type: "hard" | "soft";
    impact: number;
    reason: string;
  }>;
  explanation: string[];
};

export type ErrorHandlerPayload = {
  case_id: string;
  thrown: unknown;
  partial: {
    signals: SignalsJson | null;
    normalized: CanonicalInfractionJson | null;
    evaluation: EvaluationJson | null;
  };
};

let openaiSingleton: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "[pipeline] OPENAI_API_KEY is not set. Configure it to run the AI pipeline."
    );
  }
  if (!openaiSingleton) {
    openaiSingleton = new OpenAI({ apiKey: key });
  }
  return openaiSingleton;
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(trimmed);
  if (m) return m[1].trim();
  return trimmed;
}

function buildCombinedPromptPayload(prompt: string, input: unknown): string {
  const inputJson =
    typeof input === "string" ? input : JSON.stringify(input, null, 2);
  return [
    "You must follow the MULTACHEK instructions below and reply with one JSON object only (no markdown, no prose).",
    "",
    "--- MULTACHEK_SYSTEM_INSTRUCTIONS ---",
    prompt.trim(),
    "",
    "--- MULTACHEK_INPUT_JSON ---",
    inputJson,
  ].join("\n");
}

function parseModelJsonObject(content: string | null | undefined): Record<string, unknown> {
  if (content == null || String(content).trim() === "") {
    throw new Error("INVALID_MODEL_JSON_OUTPUT");
  }
  const raw = stripJsonFence(String(content));
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("INVALID_MODEL_JSON_OUTPUT");
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_MODEL_JSON_OUTPUT") throw e;
    throw new Error("INVALID_MODEL_JSON_OUTPUT");
  }
}

/**
 * Single combined message (instructions + input) → OpenAI → parsed JSON object only.
 */
export async function executePrompt(
  prompt: string,
  input: unknown
): Promise<Record<string, unknown>> {
  const client = getOpenAIClient();
  const combinedContent = buildCombinedPromptPayload(prompt, input);

  const completion = await client.chat.completions.create({
    model: PIPELINE_MODEL,
    temperature: PIPELINE_TEMPERATURE,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: combinedContent }],
  });

  const content = completion.choices[0]?.message?.content;
  return parseModelJsonObject(content);
}

export function resolveCaseId(raw: PipelineInput): string {
  if (
    raw &&
    typeof raw === "object" &&
    "case_id" in raw &&
    typeof (raw as { case_id: unknown }).case_id === "string"
  ) {
    return (raw as { case_id: string }).case_id;
  }
  return "pending_case";
}

/**
 * End-to-end pipeline: signal extraction → normalization → rule engine via OpenAI.
 */
export async function runMultachekPipeline(
  input: PipelineInput
): Promise<Record<string, unknown>> {
  let signalsJson: SignalsJson | null = null;
  let normalizedJson: CanonicalInfractionJson | null = null;

  try {
    const signalsRaw = await executePrompt(SIGNAL_EXTRACTOR_PROMPT_V1, input);
    signalsJson = signalsRaw as unknown as SignalsJson;
    console.log("[pipeline] step 1 signal extraction result:", JSON.stringify(signalsJson, null, 2));

    const normRaw = await executePrompt(NORMALIZATION_PROMPT_V1, {
      raw: input,
      signals: signalsJson,
    } satisfies NormalizationPipelineInput);
    normalizedJson = normRaw as unknown as CanonicalInfractionJson;
    console.log("[pipeline] step 2 normalization result:", JSON.stringify(normalizedJson, null, 2));

    const evaluationRaw = await executePrompt(
      RULE_ENGINE_PROMPT_V1,
      normalizedJson
    );
    console.log("[pipeline] step 3 rule engine result:", JSON.stringify(evaluationRaw, null, 2));

    return evaluationRaw;
  } catch (err) {
    const caseId = signalsJson?.case_id ?? resolveCaseId(input);
    const errorPayload: ErrorHandlerPayload = {
      case_id: caseId,
      thrown: err,
      partial: {
        signals: signalsJson,
        normalized: normalizedJson,
        evaluation: null,
      },
    };
    const recovered = await executePrompt(ERROR_HANDLER_PROMPT_V1, errorPayload);
    console.log("[pipeline] error handler result:", JSON.stringify(recovered, null, 2));
    return recovered;
  }
}
