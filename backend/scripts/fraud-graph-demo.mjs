#!/usr/bin/env node
/**
 * Demo CLI: lee JSON de registros y escribe resultado del motor de fraude (stdout JSON).
 *
 *   node scripts/fraud-graph-demo.mjs
 *   node scripts/fraud-graph-demo.mjs --file scripts/fixtures/fraud-sample-records.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (String(process.env.MULTACHECK_TELEMETRY ?? "").trim() === "1") {
    await import("../src/bootstrap/registerDomainPorts.js");
  }
  const { runFraudSignalGraphEngine } = await import(
    "../src/fraud/fraudGraphEngine.js"
  );

  let file = path.join(__dirname, "fixtures", "fraud-sample-records.json");
  const argIdx = process.argv.indexOf("--file");
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    file = path.resolve(process.argv[argIdx + 1]);
  }

  const raw = fs.readFileSync(file, "utf8");
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    console.error("El archivo debe ser un array de registros.");
    process.exit(1);
  }

  const out = runFraudSignalGraphEngine(records);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
