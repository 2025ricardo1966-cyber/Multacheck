/**
 * Contratos arquitectónicos (JSDoc only — sin runtime DI pesado).
 *
 * @typedef {object} IEventPublisher
 * @property {(e: import('../application/domainEvents.port.js').DomainTelemetryEvent) => void} publish Alias: `publishDomainEvent`.
 *
 * @typedef {object} IAuditLogger
 * @property {(record: Record<string, unknown>) => void | Promise<void>} append Eventos/auditoría append-only.
 *
 * @typedef {object} INormalizationService
 * @property {(body: Record<string, unknown>|null|undefined) => object} normalizeAnalyzeInput Implementación: `normalizeAnalyzeInput` en multas.
 *
 * @typedef {object} IScoringPipeline
 * @property {(multaData: Record<string, unknown>) => Promise<unknown>} processMulta Motor actual (`multaservice.processMulta`).
 *
 * @typedef {object} IRuleEngine
 * @property {(input: Record<string, unknown>) => unknown} calculateScore Expuesto por `scoring/scoringengine.js` (no acoplado aquí).
 */

export {};
