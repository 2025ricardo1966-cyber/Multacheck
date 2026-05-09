/**
 * Registro de métricas en proceso (sin dependencias de negocio).
 *
 * Histogramas / contadores por clave compuesta:
 *   `{metric_key}` ej. `latency_ms:multa.pipeline:process_multa.exit`
 *   `{metric_key}` ej. `count:event:fraud.graph.completed`
 *
 * Exportación puntual vía `getTelemetryMetricsSnapshot()` para health/debug.
 */

export {};
