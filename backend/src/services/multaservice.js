import { analyzeWithAI } from "../ai/index.js";
import { logAI } from "../config/logger.js";
import { analysisCache } from "../infra/redisCache.js";
import ollamaClient from "./ollamaclient.js";
import { applyCountryRules } from "../rules/countryrules.js";
import { calculateScore } from "../scoring/scoringengine.js";
import { detectInconsistencies } from "../core/inconsistencydetector.js";
import { buildExplanation } from "../core/explainer.js";
import { detectAppealOpportunity } from "../core/appealdetector.js";
import { classifyRisk } from "../core/riskclassifier.js";
import { multaFlowLog } from "../multas/multa.debuglog.js";

/**
 * Semáforo legal MVP (única definición de reglas en el backend).
 * GREEN | YELLOW | RED + label humano canónico.
 */
function computeLegalTrafficLightFromPreview(preview) {
  const score = Number(preview.scoring.finalScore) || 0;
  const issues = Number(preview.meta?.issues?.length) || 0;
  const appealRecommended = Boolean(preview.decision?.appeal?.recommended);

  if (score >= 62) {
    return {
      trafficLight: "RED",
      label: "Payment likely required based on enforcement standards",
    };
  }
  if ((appealRecommended && score <= 48) || (issues >= 1 && score <= 55)) {
    return {
      trafficLight: "GREEN",
      label: "Strong grounds for challenge",
    };
  }
  return {
    trafficLight: "YELLOW",
    label: "Case-dependent legal outcome",
  };
}

function normalizeGravedad(value) {
  if (!value) return "media";

  const v = String(value).toLowerCase();

  if (v.includes("alta")) return "alta";
  if (v.includes("baja")) return "baja";

  return "media";
}

/**
 * GRAVITY TRUST SYSTEM
 */
function computeTrustedGravity(aiAnalysis, multaData) {
  const desc = (multaData.description || "").toLowerCase();
  const gravedad = aiAnalysis.gravedad || "media";

  let trustWeight = 1;

  const hasStrongEvidence =
    desc.includes("prohibida") ||
    desc.includes("doble fila") ||
    desc.includes("emergencia");

  if (!desc) {
    trustWeight = 0.3;
  } else if (!hasStrongEvidence && gravedad === "alta") {
    trustWeight = 0.5;
  } else if (hasStrongEvidence && gravedad === "alta") {
    trustWeight = 1.2;
  }

  return {
    gravity: gravedad,
    trustWeight,
  };
}

/**
 * Construye preview + semáforo solo con reglas locales (sin servicios externos).
 */
function buildResultFromAiAnalysis(multaData, aiAnalysisIn) {
  const trusted = computeTrustedGravity(aiAnalysisIn, multaData);
  const aiAnalysis = { ...aiAnalysisIn, gravedad: trusted.gravity };

  const baseScoreRaw = calculateScore(multaData, aiAnalysis);
  const baseScore = Math.round(baseScoreRaw * trusted.trustWeight);

  const country = multaData.country || "AR";

  const finalScore = applyCountryRules(baseScore, country);

  const issues = detectInconsistencies(multaData, aiAnalysis);

  const explanation = buildExplanation(
    multaData,
    aiAnalysis,
    baseScore,
    finalScore,
    issues
  );

  const appeal = detectAppealOpportunity(
    multaData,
    aiAnalysis,
    issues,
    finalScore
  );

  const risk = classifyRisk(finalScore);

  const preview = {
    input: {
      country,
      type: multaData.type,
      description: multaData.description,
    },
    analysis: {
      ai: aiAnalysis,
      trust: trusted,
    },
    scoring: {
      baseScore,
      finalScore,
      risk,
    },
    decision: {
      appeal,
    },
    meta: {
      issues,
      explanation,
    },
  };

  const discharge = {
    access: "locked",
    body: null,
  };

  const { trafficLight, label } = computeLegalTrafficLightFromPreview(preview);

  return {
    success: true,
    data: {
      preview,
      discharge,
      trafficLight,
      label,
    },
  };
}

/**
 * Resolución de gravedad vía Ollama (opcional). Si falla o el JSON es inválido → "media".
 */
async function resolveGravedadWithOptionalAi(multaData) {
  let aiAnalysis = { gravedad: "media" };

  try {
    const raw = await ollamaClient.analyze({
      prompt: `
IMPORTANTE: Respondé SOLO JSON válido.

{"gravedad":"alta"}

Multa:
${JSON.stringify(multaData)}
        `,
    });

    const match = raw && String(raw).match(/\{[\s\S]*\}/);
    if (!match) {
      multaFlowLog("AI_PARSE_FALLBACK", { reason: "no_json_object" });
      return aiAnalysis;
    }

    try {
      const parsed = JSON.parse(match[0]);
      const gravedadRaw =
        parsed.gravedad ||
        parsed.frecuencia ||
        parsed.nivel ||
        parsed.riesgo;
      aiAnalysis = {
        gravedad: normalizeGravedad(gravedadRaw),
      };
    } catch (e) {
      console.error("[ERROR_CAPTURED]", e);
      multaFlowLog("AI_PARSE_FALLBACK", { reason: "invalid_json" });
      throw e;
    }
  } catch (err) {
    multaFlowLog("AI_SERVICE_FALLBACK", { message: err.message });
  }

  return aiAnalysis;
}

function shouldCacheAnalysisResult(result) {
  return (
    result &&
    typeof result === "object" &&
    (!("success" in result) || result.success !== false)
  );
}

/**
 * Análisis multa: flujo único; IA es opcional; reglas locales siempre aplican.
 */
export async function processMulta(multaData) {
  try {
    if (!multaData) {
      throw new Error("No se recibieron datos de multa");
    }

    const cached = await analysisCache.get(multaData);
    if (cached) {
      return cached;
    }

    const pipelineInput = {
      case_id:
        multaData.case_id ??
        multaData.multaId ??
        multaData.id ??
        undefined,
      raw: [
        multaData.country,
        multaData.type,
        multaData.description,
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
    };

    const start = Date.now();
    const aiResult = await analyzeWithAI(pipelineInput);
    const duration = Date.now() - start;

    const mid =
      multaData.case_id ??
      multaData.multaId ??
      multaData.id ??
      undefined;

    if (aiResult) {
      logAI("openai", duration, true, {
        multaId: mid,
        score: aiResult.final_score,
      });
      const out = convertAIFormat(aiResult);
      if (shouldCacheAnalysisResult(out)) await analysisCache.set(multaData, out);
      return out;
    }

    logAI("javascript", duration, true, { multaId: mid });

    const aiAnalysis = await resolveGravedadWithOptionalAi(multaData);

    try {
      const out = buildResultFromAiAnalysis(multaData, aiAnalysis);
      if (shouldCacheAnalysisResult(out)) await analysisCache.set(multaData, out);
      return out;
    } catch (err) {
      multaFlowLog("ANALYSIS_PIPELINE_FALLBACK", { message: err.message });
      const out = buildResultFromAiAnalysis(multaData, { gravedad: "media" });
      if (shouldCacheAnalysisResult(out)) await analysisCache.set(multaData, out);
      return out;
    }
  } catch (error) {
    multaFlowLog("ANALYSIS_FATAL_FALLBACK", { message: error.message });
    try {
      const out = buildResultFromAiAnalysis(multaData, { gravedad: "media" });
      if (shouldCacheAnalysisResult(out)) await analysisCache.set(multaData, out);
      return out;
    } catch (e2) {
      return {
        success: false,
        error: e2.message,
      };
    }
  }
}

function convertAIFormat(ai) {
  return {
    score: ai.final_score,
    trafficLight:
      ai.decision === "invalid_fine"
        ? "green"
        : ai.decision === "questionable"
          ? "yellow"
          : "red",
    explanation: ai.explanation?.join(" "),
  };
}
