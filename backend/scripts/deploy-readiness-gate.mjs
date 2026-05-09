#!/usr/bin/env node
/**
 * =============================================================================
 * Production Readiness & Deployment Control Gate
 * =============================================================================
 * No modifica lógica de negocio ni runtime de Express: solo validación offline.
 *
 * Arquitectura del pipeline (orden):
 *   1) Cargar .env + registry feature flags
 *   2) Auditoría de variables MULTACHECK_* desconocidas (WARN)
 *   3) Integridad de capas: `src/scoring/**` no importa infra/arquitectura nueva
 *   4) Suite de tests npm (critical + capas)
 *   5) Paridad scoring audit (opcional / estricto)
 *   6) Puntuación de readiness ≥ umbral (--threshold, default 100)
 *
 * Rollback (lógico):
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Primario: flags OFF + restart (sin redeploy de código)   │
 *   └───────────────────────────┬─────────────────────────────┘
 *                               ▼
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Fallback: pin de versión git/imagen y redeploy           │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Matriz de decisión (resumen):
 *   | Violación aislamiento scoring | → DENY (exit 1)              |
 *   | Fallo test obligatorio        | → DENY (exit 1)              |
 *   | parityFailures>0 y STRICT     | → DENY (exit 1)              |
 *   | Score < threshold             | → DENY (exit 1)              |
 *   | Todo OK                       | → ALLOW (exit 0, score 100)|
 *
 * CI/CD checklist:
 *   - npm ci && npm run deploy:gate --strict (opcional scoring parity)
 *   - MULTACHECK_RUN_DEPLOY_GATE=1 en deploy si querés gate automático
 *
 * Uso:
 *   node scripts/deploy-readiness-gate.mjs
 *   node scripts/deploy-readiness-gate.mjs --quick
 *   node scripts/deploy-readiness-gate.mjs --strict
 *   node scripts/deploy-readiness-gate.mjs --threshold=85
 *   node scripts/deploy-readiness-gate.mjs --integration   # incluye test:critical (API viva)
 *
 * Variables:
 *   MULTACHECK_GATE_INCLUDE_CRITICAL=1  → igual que --integration
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

function parseArgs(argv) {
  const quick = argv.includes("--quick");
  const integration =
    argv.includes("--integration") ||
    String(process.env.MULTACHECK_GATE_INCLUDE_CRITICAL ?? "").trim() === "1";
  const strict =
    argv.includes("--strict") ||
    String(process.env.MULTACHECK_DEPLOY_GATE_STRICT_SCORING ?? "").trim() ===
      "1";
  let threshold = 100;
  const ta = argv.find((a) => a.startsWith("--threshold="));
  if (ta) {
    const n = Number(ta.split("=")[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 100) threshold = n;
  }
  return { quick, strict, threshold, integration };
}

function loadRegistry() {
  const p = path.join(backendRoot, "config", "feature-flags.registry.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function auditUnknownEnvKeys(registry) {
  const known = new Set(registry.flags.map((f) => f.envKey));
  /** @type {string[]} */
  const unknown = [];
  for (const k of Object.keys(process.env)) {
    if (!k.startsWith("MULTACHECK_")) continue;
    if (known.has(k)) continue;
    unknown.push(k);
  }
  if (unknown.length) {
    console.warn(
      "[deploy-gate] WARN: MULTACHECK_* no documentadas en registry:",
      unknown.join(", ")
    );
  }
}

async function walkJsFiles(dir) {
  /** @type {string[]} */
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkJsFiles(full)));
    else if (e.name.endsWith(".js")) out.push(full);
  }
  return out;
}

/**
 * Garantiza que el motor de scoring no dependa de capas infra nuevas.
 */
async function verifyScoringLayerIsolation() {
  const scoringDir = path.join(backendRoot, "src", "scoring");
  if (!fs.existsSync(scoringDir)) return;
  const forbiddenImport = /from\s+["'][^"']*\/infra\/[^"']*["']/;
  const files = await walkJsFiles(scoringDir);
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (forbiddenImport.test(text)) {
      throw new Error(
        `[deploy-gate] Aislamiento scoring roto: import infra en ${path.relative(backendRoot, file)}`
      );
    }
  }
}

function runNpm(script) {
  return execAsync(`npm run ${script}`, {
    cwd: backendRoot,
    env: process.env,
  });
}

function aggregateScoringAuditLines(lines) {
  let parityFailures = 0;
  let n = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    try {
      const rec = JSON.parse(t);
      n++;
      if (rec.parityOk === false) parityFailures++;
    } catch {
      /* skip */
    }
  }
  return { n, parityFailures };
}

function scoringAuditGate(strict) {
  const auditPath = path.join(backendRoot, "logs", "scoring-audit.jsonl");
  if (!fs.existsSync(auditPath)) {
    console.log(
      "[deploy-gate] scoring-audit.jsonl ausente — parity omitido (generar con MULTACHECK_SCORING_TRACE=1 en entorno de validación)."
    );
    return { ok: true, skipped: true, parityFailures: 0, n: 0 };
  }
  const raw = fs.readFileSync(auditPath, "utf8");
  const agg = aggregateScoringAuditLines(raw.split("\n"));
  if (agg.parityFailures > 0) {
    const msg = `[deploy-gate] parityFailures=${agg.parityFailures} en logs/scoring-audit.jsonl`;
    if (strict) {
      console.error(msg);
      return { ok: false, skipped: false, ...agg };
    }
    console.warn(`${msg} (WARN — usar --strict para fallar)`);
    return { ok: true, skipped: false, ...agg };
  }
  console.log(
    `[deploy-gate] scoring audit OK: líneas=${agg.n}, parityFailures=${agg.parityFailures}`
  );
  return { ok: true, skipped: false, ...agg };
}

async function main() {
  const { quick, strict, threshold, integration } = parseArgs(process.argv);
  dotenv.config({ path: path.join(backendRoot, ".env") });

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" MultaCheck — Deploy Readiness Gate");
  console.log("═══════════════════════════════════════════════════════════\n");

  const registry = loadRegistry();
  console.log("[deploy-gate] Registry:", registry.version, "| baseline:", registry.legacyBaseline.slice(0, 72) + "…\n");

  auditUnknownEnvKeys(registry);

  console.log("[deploy-gate] ① Verificando aislamiento src/scoring …");
  await verifyScoringLayerIsolation();
  console.log("    ✅ Sin imports prohibidos hacia /infra/\n");

  if (integration) {
    console.log("[deploy-gate] ② Integration tier — test:critical (requiere API, ej. CRITICAL_TEST_API) …");
    try {
      await runNpm("test:critical");
      console.log("    ✅ test:critical OK\n");
    } catch (e) {
      console.error(e?.message ?? e);
      if (e?.stderr) console.error(String(e.stderr));
      console.error("\n[deploy-gate] DENY: test:critical falló (¿servidor arriba?)");
      process.exit(1);
    }
  } else {
    console.log(
      "[deploy-gate] Modo offline CI — omitiendo test:critical (usá --integration o MULTACHECK_GATE_INCLUDE_CRITICAL=1)."
    );
    console.log("");
  }

  /** Suites determinísticas sin servidor. Pesos suman 100. */
  /** @type {{ id: string, cmd: string, weight: number }[]} */
  const checks = quick
    ? [
        { id: "test:orchestrator", cmd: "test:orchestrator", weight: 34 },
        { id: "test:security-gateway", cmd: "test:security-gateway", weight: 33 },
        { id: "test:telemetry", cmd: "test:telemetry", weight: 33 },
      ]
    : [
        { id: "test:orchestrator", cmd: "test:orchestrator", weight: 22 },
        { id: "test:security-gateway", cmd: "test:security-gateway", weight: 22 },
        { id: "test:telemetry", cmd: "test:telemetry", weight: 22 },
        { id: "test:fraudGraphEngine", cmd: "test:fraudGraphEngine", weight: 17 },
        { id: "test:infraction", cmd: "test:infraction", weight: 17 },
      ];

  console.log("[deploy-gate] ③ Ejecutando tests determinísticos …");
  let earned = 0;
  let maxScore = 0;
  for (const c of checks) {
    maxScore += c.weight;
    process.stdout.write(`    → ${c.id} … `);
    try {
      await runNpm(c.cmd);
      earned += c.weight;
      console.log("OK");
    } catch (e) {
      console.log("FAIL");
      console.error(e?.message ?? e);
      if (e?.stderr) console.error(String(e.stderr));
      console.error(`\n[deploy-gate] DENY: falló ${c.id}`);
      process.exit(1);
    }
  }

  console.log("\n[deploy-gate] ④ Verificación scoring audit (paridad) …");
  const auditResult = scoringAuditGate(strict);
  if (!auditResult.ok) {
    process.exit(1);
  }

  const score = Math.round((earned / maxScore) * 100);
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(` Readiness score: ${score}/${threshold} (ponderación tests)`);
  console.log("═══════════════════════════════════════════════════════════");

  if (score < threshold) {
    console.error(`\n[deploy-gate] DENY: score ${score} < threshold ${threshold}`);
    process.exit(1);
  }

  console.log("\n[deploy-gate] ALLOW — gate pasado. Safe release bajo configuración validada.\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("[deploy-gate] ERROR:", e?.message ?? e);
  process.exit(1);
});
