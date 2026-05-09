import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true },
        }
      : undefined,
});

export const logError = (context, error, metadata = {}) => {
  const err =
    error instanceof Error ? error : new Error(String(error ?? "unknown"));
  logger.error({
    context,
    error: err.message,
    stack: err.stack,
    ...metadata,
  });
};

export const logPayment = (multaId, event, data) => {
  logger.info({
    type: "payment",
    multaId,
    event,
    ...data,
  });
};

export const logAI = (provider, duration, success, metadata = {}) => {
  logger.info({
    type: "ai",
    provider,
    duration_ms: duration,
    success,
    ...metadata,
  });
};
