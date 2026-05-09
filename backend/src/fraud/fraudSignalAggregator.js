/**
 * Capa de agregación de señales: deduplica claves estables y fusiona severidad máxima.
 * Sin efectos secundarios.
 */

/**
 * @typedef {{
 *   signalType: string,
 *   severityScore: number,
 *   confidenceIndex: number,
 *   evidenceNodeIds: string[],
 *   reasonCodes: string[],
 *   contributingEdges: Array<{ from: string, to: string, kind: string, weight: number, at?: string }>,
 *   graphPathExplanation: string[],
 *   meta?: Record<string, unknown>,
 * }} FraudSignal
 */

function stableSignalKey(s) {
  const meta = s.meta ?? {};
  const plate = meta.plate ?? meta.entityKey ?? "";
  const sig = String(s.signalType);
  return `${sig}|${plate}|${(meta.violationTypeKey ?? "")}`;
}

/**
 * @param {FraudSignal[]} signals
 * @returns {{ aggregatedSignals: FraudSignal[], summary: { rawCount: number, aggregatedCount: number, maxSeverity: number } }}
 */
export function aggregateFraudSignals(signals) {
  /** @type {Map<string, FraudSignal>} */
  const map = new Map();

  for (const s of signals) {
    const k = stableSignalKey(s);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...s, contributingEdges: [...s.contributingEdges] });
      continue;
    }
    const merged = {
      ...prev,
      severityScore: Math.max(prev.severityScore, s.severityScore),
      confidenceIndex: Math.max(prev.confidenceIndex, s.confidenceIndex),
      evidenceNodeIds: [...new Set([...prev.evidenceNodeIds, ...s.evidenceNodeIds])],
      reasonCodes: [...new Set([...prev.reasonCodes, ...s.reasonCodes])],
      graphPathExplanation:
        prev.graphPathExplanation.length >= s.graphPathExplanation.length
          ? prev.graphPathExplanation
          : s.graphPathExplanation,
      contributingEdges: [...prev.contributingEdges, ...s.contributingEdges].slice(
        0,
        120
      ),
      meta: { ...prev.meta, ...s.meta },
    };
    map.set(k, merged);
  }

  const aggregatedSignals = [...map.values()].sort((a, b) => {
    if (b.severityScore !== a.severityScore)
      return b.severityScore - a.severityScore;
    return String(a.signalType).localeCompare(String(b.signalType));
  });

  const maxSeverity = aggregatedSignals.reduce(
    (m, x) => Math.max(m, x.severityScore),
    0
  );

  return {
    aggregatedSignals,
    summary: {
      rawCount: signals.length,
      aggregatedCount: aggregatedSignals.length,
      maxSeverity,
    },
  };
}
