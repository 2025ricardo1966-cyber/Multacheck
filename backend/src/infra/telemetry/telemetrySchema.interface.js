/**
 * Esquema unificado JSON-first (una línea JSON por evento).
 *
 * @typedef {'debug'|'info'|'warn'|'error'} TelemetrySeverity
 *
 * @typedef {{
 *   request_id: string,
 *   trace_id: string,
 *   span_id: string,
 *   module_source: string,
 *   event_type: string,
 *   timestamp: string,
 *   severity_level: TelemetrySeverity,
 *   payload_snapshot_hash: string,
 *   payload_redacted?: Record<string, unknown>,
 * }} TelemetryCoreEvent
 *
 * Contrato de propagación:
 * - Cabeceras entrantes: `traceparent` (W3C), `tracestate`, `X-MultaCheck-Trace-Id`.
 * - Si no hay trace, `trace_id === request_id` (determinístico por petición HTTP).
 */

export {};
