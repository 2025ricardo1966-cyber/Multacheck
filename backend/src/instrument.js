/**
 * Sentry — debe cargarse antes que Express y el resto de la app (import en server.js).
 */
import * as Sentry from "@sentry/node";

export function isSentryEnabled() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.SENTRY_DSN?.trim())
  );
}

if (isSentryEnabled()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN.trim(),
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [Sentry.expressIntegration()],
  });
}

export { Sentry };
