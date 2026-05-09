import pino from "pino";

function createLogger() {
  try {
    return pino({
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: { colorize: true },
            }
          : undefined,
    });
  } catch (err) {
    console.error(
      "[MultaCheck] Logger init failed; using console:",
      err?.message || err
    );
    const fallback = {
      info: (...args) => console.log(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => console.error(...args),
      debug: (...args) => console.debug(...args),
      child: () => fallback,
    };
    return fallback;
  }
}

export const logger = createLogger();

export const logError = (context, error, metadata = {}) => {
  try {
    const err =
      error instanceof Error ? error : new Error(String(error ?? "unknown"));
    logger.error({
      context,
      error: err.message,
      stack: err.stack,
      ...metadata,
    });
  } catch (logErr) {
    console.error(
      "[MultaCheck] logError secondary failure:",
      logErr?.message || logErr,
      context,
      error
    );
  }
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
