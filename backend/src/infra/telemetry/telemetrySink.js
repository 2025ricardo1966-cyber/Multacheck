import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../../config/logger.js";
import { getTelemetryJsonlPath } from "./config.js";

/**
 * Persistencia JSONL (fire-and-forget).
 * @param {Record<string, unknown>} record
 */
export function appendTelemetryJsonl(record) {
  const filePath = getTelemetryJsonlPath();
  const line = `${JSON.stringify(record)}\n`;
  fs.mkdir(path.dirname(filePath), { recursive: true })
    .then(() => fs.appendFile(filePath, line, "utf8"))
    .catch((e) => {
      console.error("[telemetry] append failed:", e?.message ?? e);
    });
}

/**
 * Espejo opcional en logger estructurado (filtrable por `telemetry_core`).
 * @param {Record<string, unknown>} record
 */
export function mirrorTelemetryToPino(record) {
  const mirror = String(process.env.MULTACHECK_TELEMETRY_PINO_MIRROR ?? "").trim() === "1";
  if (!mirror) return;
  try {
    logger.info({ telemetry_core: true, ...record });
  } catch {
    /* no-op */
  }
}
