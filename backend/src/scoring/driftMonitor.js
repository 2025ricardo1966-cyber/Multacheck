/**
 * Monitor en memoria de frecuencias de activación de reglas (modo auditoría).
 * Determinístico; sin ML externo.
 */

const firedCounts = new Map();
const evaluationCount = { n: 0 };

/** @param {{ steps: Array<{ ruleId: string, fired: boolean }> }} trace */
export function observeEngineTrace(trace) {
  if (!trace?.steps) return;
  evaluationCount.n += 1;
  for (const s of trace.steps) {
    if (!s.fired) continue;
    const k = s.ruleId;
    firedCounts.set(k, (firedCounts.get(k) ?? 0) + 1);
  }
}

export function driftMonitorSnapshot() {
  return {
    evaluations: evaluationCount.n,
    firedFrequency: Object.fromEntries(firedCounts.entries()),
  };
}

export function driftMonitorReset() {
  firedCounts.clear();
  evaluationCount.n = 0;
}

/**
 * Deriva índice simple 0–1: máxima desviación vs reparto uniforme sobre reglas disparadas.
 * @param {Record<string, number>} baselineFrequencies opcional fixture golden
 */
export function computeDriftIndex(currentSnapshot, baselineFrequencies = null) {
  const freq = currentSnapshot?.firedFrequency ?? {};
  const keys = Object.keys(freq);
  if (keys.length === 0) return 0;

  if (!baselineFrequencies || Object.keys(baselineFrequencies).length === 0) {
    return 0;
  }

  const total = keys.reduce((a, k) => a + freq[k], 0);
  const baseTotal = Object.values(baselineFrequencies).reduce((a, v) => a + v, 0);
  if (total === 0 || baseTotal === 0) return 0;

  let maxDev = 0;
  const allKeys = new Set([...Object.keys(freq), ...Object.keys(baselineFrequencies)]);
  for (const k of allKeys) {
    const p = (freq[k] ?? 0) / total;
    const q = (baselineFrequencies[k] ?? 0) / baseTotal;
    maxDev = Math.max(maxDev, Math.abs(p - q));
  }
  return Number(maxDev.toFixed(6));
}
