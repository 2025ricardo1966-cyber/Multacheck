import * as Sentry from "@sentry/node";

/**
 * @sentry/node v8+ ya no usa `Sentry.Handlers.*`: Express va con `expressIntegration`
 * + `setupExpressErrorHandler` al final del stack.
 */
export function initSentry(app) {
  if (!process.env.SENTRY_DSN?.trim()) {
    console.log("⚠️ Sentry disabled (no DSN)");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN.trim(),
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    integrations: [Sentry.expressIntegration()],
  });

  console.log("✅ Sentry monitoring active");
}

export function sentryErrorHandler(app) {
  if (!process.env.SENTRY_DSN?.trim()) {
    return;
  }
  Sentry.setupExpressErrorHandler(app);
}
