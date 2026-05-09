#!/usr/bin/env node
/**
 * Lee scoring-audit.jsonl y emite agregados + índice de deriva opcional vs baseline.
 *
 * Uso:
 *   node scripts/scoring-drift-report.mjs
 *   node scripts/scoring-drift-report.mjs --file logs/scoring-audit.jsonl
 *   node scripts/scoring-drift-report.mjs --baseline scripts/fixtures/scoring-baseline-freq.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeDriftIndex } from "../src/scoring/driftMonitor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  let file = path.join(__dirname, "../logs/scoring-audit.jsonl");
  let baseline = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) file = path.resolve(argv[++i]);
    else if (argv[i] === "--baseline" && argv[i + 1])
      baseline = path.resolve(argv[++i]);
  }
  return { file, baseline };
}

function aggregate(lines) {
  const manifestCounts = {};
  const firedAgg = {};
  let parityFailures = 0;
  let n = 0;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    let rec;
    try {
      rec = JSON.parse(t);
    } catch {
      continue;
    }
    n += 1;
    const mv = rec.manifestVersion ?? "unknown";
    manifestCounts[mv] = (manifestCounts[mv] ?? 0) + 1;
    if (rec.parityOk === false) parityFailures += 1;
    if (Array.isArray(rec.firedRuleIds)) {
      for (const id of rec.firedRuleIds) {
        firedAgg[id] = (firedAgg[id] ?? 0) + 1;
      }
    }
  }

  return { n, manifestCounts, firedAgg, parityFailures };
}

function main() {
  const { file, baseline } = parseArgs(process.argv);
  if (!fs.existsSync(file)) {
    console.log(
      JSON.stringify({
        event: "scoring_drift_report",
        error: "audit_file_missing",
        path: file,
        hint: "Activá MULTACHECK_SCORING_TRACE=1 y ejecutá análisis JS (sin pipeline OpenAI) para generar líneas.",
      })
    );
    process.exit(0);
  }

  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split("\n");
  const agg = aggregate(lines);

  let driftVersusBaseline = null;
  if (baseline && fs.existsSync(baseline)) {
    const baseFreq = JSON.parse(fs.readFileSync(baseline, "utf8"));
    driftVersusBaseline = computeDriftIndex(
      { firedFrequency: agg.firedAgg },
      baseFreq
    );
  }

  console.log(
    JSON.stringify({
      event: "scoring_drift_report",
      auditPath: file,
      recordsParsed: agg.n,
      manifestHistogram: agg.manifestCounts,
      firedRuleHistogram: agg.firedAgg,
      parityFailures: agg.parityFailures,
      driftIndexVsBaseline: driftVersusBaseline,
    })
  );
}

main();
