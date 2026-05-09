import crypto from "node:crypto";
import { analyzeWithAI } from "../ai/index.js";
import { logAI } from "../config/logger.js";
import { analysisCache } from "../infra/redisCache.js";
import ollamaClient from "./ollamaclient.js";
import { applyCountryRules } from "../rules/countryrules.js";
import { calculateScore } from "../scoring/scoringengine.js";
import {
  observeEngineTrace,
  driftMonitorSnapshot,
} from "../scoring/driftMonitor.js";
import { buildPipelineExplainability } from "../scoring/pipelineExplain.js";
import { appendScoringAuditRecord } from "../scoring/scoringAuditLog.js";
import { detectInconsistencies } from "../core/inconsistencydetector.js";
import { buildExplanation } from "../core/explainer.js";
import { detectAppealOpportunity } from "../core/appealdetector.js";
import { classifyRisk } from "../core/riskclassifier.js";
import { multaFlowLog } from "../multas/multa.debuglog.js";

function scoringTraceEnabled() {
  return process.env.MULTACHECK_SCORING_TRACE?.trim() === "1";
}

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
      label:
        "Según parámetros habituales de fiscalización, es probable que corresponda abonar o regularizar dentro de los plazos legales.",
    };
  }
  if ((appealRecommended && score <= 48) || (issues >= 1 && score <= 55)) {
    return {
      trafficLight: "GREEN",
      label:
        "Hay margen razonable para evaluar una impugnación u otro planteo ante la administración, según plazos y normativa local.",
    };
  }
  return {
    trafficLight: "YELLOW",
    label:
      "El resultado depende del expediente concreto y de la normativa aplicable; conviene revisar documentación y plazos.",
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

  /** Explicabilidad / traza del motor (solo con MULTACHECK_SCORING_TRACE=1). */
  let scoringExplainability = null;
  if (scoringTraceEnabled()) {
    scoringExplainability = buildPipelineExplainability({
      multaData,
      aiAnalysis,
      trusted,
      baseScoreRaw,
      baseScore,
      finalScore,
      country,
    });
    observeEngineTrace({ steps: scoringExplainability.engineTrace });

    const requestHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          country: multaData.country,
          type: multaData.type,
          description: multaData.description,
          gravedad: aiAnalysis.gravedad,
          manifestVersion: scoringExplainability.manifestVersion,
        })
      )
      .digest("hex");

    const auditLine = {
      requestHash,
      manifestVersion: scoringExplainability.manifestVersion,
      parityOk: scoringExplainability.parityEngineVsCanonical,
      firedRuleIds: scoringExplainability.engineTrace
        .filter((s) => s.fired)
        .map((s) => s.ruleId),
      baseScoreRaw,
      baseScore,
      finalScore,
      country,
      driftMonitorAtWrite: driftMonitorSnapshot(),
    };
    if (process.env.MULTACHECK_SCORING_AUDIT_FULL?.trim() === "1") {
      auditLine.explainability = scoringExplainability;
    }
    appendScoringAuditRecord(auditLine);
  }

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
      ...(scoringExplainability
        ? { scoringExplainability }
        : {}),
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
