/**
 * Agregación ligera en memoria (una sola instancia Node).
 */

/** @type {Map<string, number>} */
const counters = new Map();

/** @type {Map<string, number[]>} */
const latencySamples = new Map();

export function telemetryIncrement(metricKey, delta = 1) {
  counters.set(metricKey, (counters.get(metricKey) ?? 0) + delta);
}

/**
 * @param {string} metricKey
 * @param {number} ms
 * @param {number} maxSamples
 */
export function telemetryRecordLatency(metricKey, ms, maxSamples = 50) {
  const arr = latencySamples.get(metricKey) ?? [];
  arr.push(ms);
  while (arr.length > maxSamples) arr.shift();
  latencySamples.set(metricKey, arr);
}

export function telemetryLatencyStats(metricKey) {
  const arr = latencySamples.get(metricKey);
  if (!arr?.length) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  const sorted = [...arr].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
  return {
    count: arr.length,
    sum_ms: sum,
    avg_ms: sum / arr.length,
    p95_ms: p95,
    max_ms: sorted[sorted.length - 1],
  };
}

export function getTelemetryMetricsSnapshot() {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const [k, v] of counters) counts[k] = v;

  /** @type {Record<string, ReturnType<typeof telemetryLatencyStats>>} */
  const latencies = {};
  for (const key of latencySamples.keys()) {
    const s = telemetryLatencyStats(key);
    if (s) latencies[key] = s;
  }

  return { counters: counts, latencies };
}

/** @internal */
export function __resetTelemetryMetricsForTests() {
  counters.clear();
  latencySamples.clear();
}
