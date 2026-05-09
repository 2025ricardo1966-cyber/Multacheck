/**
 * Composition root mínimo: cablea puertos de aplicación → adaptadores infra.
 * Importar antes de rutas HTTP (`app.js`).
 */
import { attachTelemetryDomainSubscriber } from "../infra/telemetry/telemetryDomainSubscriber.js";

attachTelemetryDomainSubscriber();
