/**
 * Rate limiting en el edge (capa gateway). Implementación: express-rate-limit con generadores de clave por IP.
 *
 * @typedef {object} GatewayRateLimiterFactory
 * @property {() => import('express').RequestHandler} createBurstLimiter Ventana corta anti-rafaga.
 * @property {() => import('express').RequestHandler} createSustainedLimiter Ventana larga sostenida.
 *
 * Variables opcionales:
 * - MULTACHECK_GATEWAY_BURST_WINDOW_MS (default 60000)
 * - MULTACHECK_GATEWAY_BURST_MAX (default 80)
 * - MULTACHECK_GATEWAY_SUSTAINED_WINDOW_MS (default 900000)
 * - MULTACHECK_GATEWAY_SUSTAINED_MAX (default 2000)
 */

export {};
