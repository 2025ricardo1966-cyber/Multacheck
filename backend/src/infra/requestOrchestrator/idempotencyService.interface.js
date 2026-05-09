/**
 * Idempotency backend contract for HTTP analyze replay (infrastructure only).
 *
 * Composite cache keys are sha256 hex strings derived from tenant scope,
 * client idempotency key, and canonical analyze body hash — see httpAnalyzeOrchestrator.js.
 *
 * @typedef {{ status: number, body: unknown }} AnalyzeCachedHttpPayload
 *
 * @typedef {object} AnalyzeIdempotencyService
 * @property {(compositeKey: string) => AnalyzeCachedHttpPayload | null} get
 * @property {(compositeKey: string, value: AnalyzeCachedHttpPayload, ttlMs: number) => void} set
 */

export {};
