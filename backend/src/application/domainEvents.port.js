/**
 * Puerto de publicación de eventos de aplicación (sin implementación de infra).
 * Cableado en `bootstrap/registerDomainPorts.js` vía composición.
 *
 * @typedef {{
 *   type: string,
 *   module_source: string,
 *   severity_level?: string,
 *   payload?: Record<string, unknown>,
 *   _telemetryContextOverride?: { requestId?: string, traceId?: string, spanId?: string },
 * }} DomainTelemetryEvent
 */

/** @type {(e: DomainTelemetryEvent) => void} */
let publishImpl = () => {};

/**
 * Registra el publicador (composition root). Sustituye el anterior.
 * @param {(e: DomainTelemetryEvent) => void} fn
 */
export function configureDomainEventPublisher(fn) {
  publishImpl = typeof fn === "function" ? fn : () => {};
}

/** Emite evento observacional; no altera payloads de negocio. */
export function publishDomainEvent(event) {
  try {
    publishImpl(event);
  } catch (e) {
    console.error("[domainEvents.port]", e?.message ?? e);
  }
}
