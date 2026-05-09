/**
 * Trazabilidad del motor de puntaje (espejo determinístico de calculateScore).
 * No altera calculateScore; debe mantenerse alineado — tests de paridad obligatorios.
 */
import {
  BASE_RULES,
  GRAVEDAD_BONUS,
  SCORING_ENGINE_MANIFEST_VERSION,
  calculateScore,
} from "./scoringengine.js";

/**
 * @typedef {{ ruleId: string, fired: boolean, detail?: unknown, delta: number, runningScore: number }} EngineTraceStep
 */

/**
 * @param {Record<string, unknown>} multaData
 * @param {Record<string, unknown>} aiAnalysis
 * @returns {{ manifestVersion: string, steps: EngineTraceStep[], finalScore: number, parityOk: boolean }}
 */
export function buildEngineDecisionTrace(multaData, aiAnalysis) {
  const tipo = multaData?.type || "otros";
  const gravedad = aiAnalysis?.gravedad || "media";

  /** @type {EngineTraceStep[]} */
  const steps = [];

  let score = BASE_RULES[tipo] ?? BASE_RULES.otros;
  steps.push({
    ruleId: "ENGINE_BASE_BY_TYPE",
    fired: true,
    detail: { tipoResuelto: tipo, tabla: "BASE_RULES" },
    delta: score,
    runningScore: score,
  });

  const bonus = GRAVEDAD_BONUS[gravedad] ?? 0;
  score += bonus;
  steps.push({
    ruleId: "ENGINE_GRAVEDAD_BONUS",
    fired: bonus !== 0,
    detail: { gravedad },
    delta: bonus,
    runningScore: score,
  });

  const desc = String(multaData?.description ?? "").toLowerCase();

  const ctx = [
    { ruleId: "ENGINE_CTX_PROHIBIDA", needle: "prohibida", delta: 15 },
    { ruleId: "ENGINE_CTX_DOBLE_FILA", needle: "doble fila", delta: 20 },
    { ruleId: "ENGINE_CTX_EMERGENCIA", needle: "emergencia", delta: 30 },
  ];

  for (const c of ctx) {
    const fired = desc.includes(c.needle);
    const d = fired ? c.delta : 0;
    if (fired) score += d;
    steps.push({
      ruleId: c.ruleId,
      fired,
      detail: { needle: c.needle },
      delta: d,
      runningScore: score,
    });
  }

  if (!desc) {
    score -= 10;
    steps.push({
      ruleId: "ENGINE_EMPTY_DESCRIPTION_PENALTY",
      fired: true,
      detail: {},
      delta: -10,
      runningScore: score,
    });
  } else {
    steps.push({
      ruleId: "ENGINE_EMPTY_DESCRIPTION_PENALTY",
      fired: false,
      detail: {},
      delta: 0,
      runningScore: score,
    });
  }

  const rawBeforeClamp = score;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  steps.push({
    ruleId: "ENGINE_CLAMP_ROUND_0_100",
    fired: rawBeforeClamp !== clamped || !Number.isInteger(score),
    detail: { antes: rawBeforeClamp, despues: clamped },
    delta: clamped - rawBeforeClamp,
    runningScore: clamped,
  });

  const canonical = calculateScore(multaData, aiAnalysis);
  const parityOk = clamped === canonical;

  return {
    manifestVersion: SCORING_ENGINE_MANIFEST_VERSION,
    steps,
    finalScore: clamped,
    parityOk,
  };
}
