import { configureDomainEventPublisher } from "../../application/domainEvents.port.js";
import { isTelemetryEnabled } from "./config.js";
import { telemetryEmit } from "./telemetryEmit.js";

/**
 * Suscribe telemetría al puerto de dominio (observer). Sin imports de dominio → infra.
 */
export function attachTelemetryDomainSubscriber() {
  configureDomainEventPublisher((event) => {
    if (!isTelemetryEnabled()) return;
    if (!event?.type || !event.module_source) return;
    telemetryEmit({
      module_source: event.module_source,
      event_type: event.type,
      severity_level: event.severity_level,
      payload: event.payload ?? {},
      _telemetryContextOverride: event._telemetryContextOverride,
    });
  });
}
