import {
  PORT as REQUESTED_PORT,
  multacheckAutoIncrementPortEnabled,
  multacheckAutoIncrementMax,
} from "./config/env.js";
import { logger } from "./config/logger.js";
import app from "./app.js";
import prisma from "./db/prisma.js";

process.on("unhandledRejection", (reason) => {
  try {
    const msg =
      reason instanceof Error ? reason.message : String(reason ?? "unknown");
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.error(
      {
        context: "process_unhandledRejection",
        reason: msg,
        stack,
      },
      "Unhandled promise rejection"
    );
  } catch {
    console.error("[MultaCheck] unhandledRejection:", reason);
  }
});

process.on("uncaughtException", (err) => {
  try {
    logger.error(
      {
        context: "process_uncaughtException",
        stack: err?.stack,
      },
      err?.message ?? String(err)
    );
  } catch {
    console.error("[MultaCheck] uncaughtException:", err);
  }
  process.exit(1);
});

function assertEnv() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL es obligatoria (PostgreSQL).");
    process.exit(1);
  }

  if (!process.env.JWT_SECRET?.trim()) {
    console.error("JWT_SECRET es obligatoria.");
    process.exit(1);
  }
}

assertEnv();

function logStripeBootDiagnostics() {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      logger.warn(
        {
          context: "stripe_boot",
          endpoint: "/api/billing/webhook",
        },
        "STRIPE_WEBHOOK_SECRET unset — webhook endpoint returns 503 until configured"
      );
    }
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      logger.warn(
        { context: "stripe_boot" },
        "STRIPE_SECRET_KEY unset — Stripe SDK unavailable for checkout y procesamiento async del webhook"
      );
    }
  } catch (e) {
    console.warn(
      "[MultaCheck] stripe_boot diagnostics:",
      e?.message ?? String(e)
    );
  }
}

logStripeBootDiagnostics();

/**
 * Validación estricta de app Express
 */
if (typeof app?.listen !== "function") {
  console.error(
    "[MultaCheck] `app` no es una instancia Express válida (app.listen ausente)."
  );
  process.exit(1);
}

const LISTEN_HOST = process.env.LISTEN_HOST?.trim() || "127.0.0.1";

function attachGracefulShutdown(httpServer) {
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[MultaCheck] Señal ${signal} — cerrando servidor HTTP…`);
    await new Promise((resolve) => {
      httpServer.close(() => resolve());
      setTimeout(resolve, 12_000);
    });
    try {
      await prisma.$disconnect();
      console.log("[MultaCheck] Prisma desconectado.");
    } catch (e) {
      console.error("[MultaCheck] Prisma disconnect:", e?.message ?? e);
    }
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  if (process.platform !== "win32") {
    process.once("SIGUSR2", () => void shutdown("SIGUSR2"));
  }
}

function listenOnce(port, host) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host);
    const onListening = () => {
      server.off("error", onError);
      resolve(server);
    };
    const onError = (err) => {
      server.off("listening", onListening);
      reject(err);
    };
    server.once("listening", onListening);
    server.once("error", onError);
  });
}

function explainListenFailure(port, err) {
  console.error("[MultaCheck] Error al iniciar servidor:", err.message);
  if (err.code === "EADDRINUSE") {
    console.warn(
      `[MultaCheck] Puerto ${port} ya está en uso (${LISTEN_HOST}). Revisá otra terminal o un proceso huérfano de Node.`
    );
    console.warn(
      `[MultaCheck] Opciones: cerrá el proceso que usa ese puerto; o definí PORT distinto en .env; o en desarrollo MULTACHECK_AUTO_INCREMENT_PORT=1 (y VITE_BACKEND_PORT igual al puerto efectivo en frontend/.env).`
    );
    if (process.platform === "win32") {
      console.warn(
        `[MultaCheck] Windows (PowerShell): Get-NetTCPConnection -LocalPort ${port} | Format-Table; taskkill /PID <pid> /F`
      );
    } else {
      console.warn(
        `[MultaCheck] Unix: lsof -iTCP:${port} -sTCP:LISTEN -Pn ; kill <pid>`
      );
    }
  }
}

async function startListening() {
  const auto = multacheckAutoIncrementPortEnabled();
  const extra = auto ? multacheckAutoIncrementMax() : 0;
  const attempts = 1 + extra;
  let lastErr;

  console.log(
    `[MultaCheck] Solicitud de arranque: puerto base ${REQUESTED_PORT} en ${LISTEN_HOST}` +
      (auto ? ` (auto-incremento hasta +${extra})` : "")
  );

  for (let i = 0; i < attempts; i++) {
    const port = REQUESTED_PORT + i;
    if (port > 65535) break;

    try {
      const server = await listenOnce(port, LISTEN_HOST);

      process.env.MULTACHECK_EFFECTIVE_PORT = String(port);

      console.log(
        `[MultaCheck] Server listening on http://${LISTEN_HOST}:${port}`
      );

      const nodeEnv = process.env.NODE_ENV ?? "(unset)";
      const stripeSigning = process.env.STRIPE_WEBHOOK_SECRET?.trim()
        ? "set"
        : "unset";
      const stripeSdkKey = process.env.STRIPE_SECRET_KEY?.trim()
        ? "set"
        : "unset";
      console.log(
        `[MultaCheck] Boot OK · NODE_ENV=${nodeEnv} · DATABASE_URL=${process.env.DATABASE_URL?.trim() ? "set" : "MISSING"} · JWT_SECRET=${process.env.JWT_SECRET?.trim() ? "set" : "MISSING"} · OPENAI_API_KEY=${process.env.OPENAI_API_KEY?.trim() ? "set" : "unset"} · STRIPE_WEBHOOK_SECRET=${stripeSigning} · STRIPE_SECRET_KEY=${stripeSdkKey} · webhook_route=/api/billing/webhook`
      );

      attachGracefulShutdown(server);

      if (port !== REQUESTED_PORT) {
        console.warn(
          `[MultaCheck] Puerto solicitado ${REQUESTED_PORT} ocupado — usando ${port}. Proxy Vite: definí VITE_BACKEND_PORT=${port} en frontend/.env.development.local (o equivalente).`
        );
      }

      server.on("error", (err) => {
        console.error("[MultaCheck] Error en servidor HTTP:", err.message);
      });

      return server;
    } catch (err) {
      lastErr = err;
      const isAddrInUse = err.code === "EADDRINUSE";
      if (isAddrInUse && auto && i < attempts - 1) {
        console.warn(
          `[MultaCheck] Puerto ${port} ocupado — probando ${port + 1}…`
        );
        continue;
      }
      explainListenFailure(port, err);
      process.exit(1);
    }
  }

  if (lastErr) explainListenFailure(REQUESTED_PORT + attempts - 1, lastErr);
  console.error(
    `[MultaCheck] No se pudo enlazar ningún puerto entre ${REQUESTED_PORT} y ${REQUESTED_PORT + extra}.`
  );
  process.exit(1);
}

startListening().catch((err) => {
  console.error("[MultaCheck] Arranque inesperado:", err);
  process.exit(1);
});
