#!/usr/bin/env node
/**
 * Timeline determinística por `trace_id` desde el sink JSONL (`telemetry-core`).
 *
 * Uso:
 *   node scripts/telemetry-replay.mjs --trace=<trace_id> [--file=logs/telemetry-core.jsonl]
 */

import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const s = a.slice(2);
    const eq = s.indexOf("=");
    if (eq === -1) out[s] = "1";
    else out[s.slice(0, eq)] = s.slice(eq + 1);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const traceId = args.trace;
  const file =
    args.file?.trim() ||
    path.join(process.cwd(), "logs", "telemetry-core.jsonl");

  if (!traceId?.trim()) {
    console.error(
      "Uso: node scripts/telemetry-replay.mjs --trace=<trace_id> [--file=ruta.jsonl]"
    );
    process.exit(2);
  }

  if (!fs.existsSync(file)) {
    console.error(`Archivo no encontrado: ${file}`);
    process.exit(1);
  }

  const stream = fs.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  /** @type {Record<string, unknown>[]} */
  const rows = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.trace_id === traceId) rows.push(row);
    } catch {
      /* línea corrupta */
    }
  }

  rows.sort((a, b) =>
    String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? ""))
  );

  for (const r of rows) {
    console.log(
      JSON.stringify({
        timestamp: r.timestamp,
        module_source: r.module_source,
        event_type: r.event_type,
        severity_level: r.severity_level,
        payload_snapshot_hash: r.payload_snapshot_hash,
        request_id: r.request_id,
      })
    );
  }

  if (rows.length === 0) {
    console.error(`Sin eventos para trace_id=${traceId}`);
    process.exit(3);
  }
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
