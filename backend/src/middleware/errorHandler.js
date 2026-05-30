import { Sentry, isSentryEnabled } from "../instrument.js";
import { logger } from "../config/logger.js";

export function globalErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const errorId = err.id || crypto.randomUUID().slice(0, 8);
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  logger.error(
    {
      context: "global_error_handler",
      errorId,
      message: err.message,
      stack: err.stack,
      statusCode,
      url: req.originalUrl ?? req.url,
      method: req.method,
      userId: req.auth?.userId,
      tenantId: req.auth?.tenantId,
    },
    "Unhandled request error"
  );

  if (isSentryEnabled()) {
    Sentry.captureException(err, {
      tags: { errorId, route: req.originalUrl ?? req.url },
      extra: {
        method: req.method,
        userId: req.auth?.userId,
        tenantId: req.auth?.tenantId,
      },
    });
  }

  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === "production" && statusCode >= 500
        ? "Internal server error"
        : err.message,
    errorId,
  });
}
