/**
 * Explicabilidad end-to-end: motor → peso de confianza → reglas por país.
 * Sin efectos secundarios; solo lectura de valores ya calculados en multaservice.
 */
import { buildEngineDecisionTrace } from "./decisionTrace.js";

/**
 * @param {{
 *   multaData: Record<string, unknown>,
 *   aiAnalysis: Record<string, unknown>,
 *   trusted: { gravity: string, trustWeight: number },
 *   baseScoreRaw: number,
 *   baseScore: number,
 *   finalScore: number,
 *   country: string,
 * }} args
 */
export function buildPipelineExplainability(args) {
  const {
    multaData,
    aiAnalysis,
    trusted,
    baseScoreRaw,
    baseScore,
    finalScore,
    country,
  } = args;

  const engine = buildEngineDecisionTrace(multaData, aiAnalysis);

  const trustStep = {
    ruleId: "PIPELINE_TRUST_WEIGHT",
    fired: true,
    detail: {
      gravityResolved: trusted.gravity,
      trustWeight: trusted.trustWeight,
      formula: "baseScore = round(baseScoreRaw * trustWeight)",
      baseScoreRaw,
      baseScore,
      roundingResidual:
        baseScore - Math.round(baseScoreRaw * trusted.trustWeight),
    },
    contributionVersusRawEngineScore:
      Number((baseScore - baseScoreRaw).toFixed(6)),
  };

  const countryDelta = finalScore - baseScore;
  const countryStep = {
    ruleId: "PIPELINE_COUNTRY_RULES",
    fired: countryDelta !== 0 || country === "AR",
    detail: {
      country,
      applied: country === "AR" ? "applyCountryRules_AR_v1" : "noop",
    },
    delta: countryDelta,
    runningAfterEngineTrust: baseScore,
    finalScore,
  };

  const normalizedInputSnapshot = {
    country: multaData?.country ?? null,
    type: multaData?.type ?? null,
    descriptionLen: String(multaData?.description ?? "").length,
    amount: multaData?.amount ?? null,
  };

  return {
    schema: "multacheck/scoring_explain/v1",
    manifestVersion: engine.manifestVersion,
    parityEngineVsCanonical: engine.parityOk,
    normalizedInputSnapshot,
    engineTrace: engine.steps,
    trustAdjustment: trustStep,
    countryAdjustment: countryStep,
    outputs: {
      baseScoreRaw,
      baseScore,
      finalScore,
    },
    confidenceConsistency: engine.parityOk
      ? "ok"
      : "parity_mismatch_engine_vs_calculateScore",
  };
}
