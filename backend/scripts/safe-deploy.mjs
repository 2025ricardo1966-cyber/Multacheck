#!/usr/bin/env node
/**
 * Deploy con rollback git si el health post-arranque no es `healthy`.
 * Requiere API accesible en API_URL para la verificación (Stripe/constraints igual que /api/health).
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

const API_URL = (
  process.env.API_URL ||
  process.env.CRITICAL_TEST_API?.trim() ||
  "http://localhost:3000"
).replace(/\/$/, "");

async function gitRootDir() {
  const { stdout } = await execAsync("git rev-parse --show-toplevel", {
    cwd: backendRoot,
  });
  return stdout.trim();
}

function runInBackend(cmd) {
  return execAsync(cmd, {
    cwd: backendRoot,
    env: process.env,
  });
}

async function restartProcess(stepLabel) {
  const custom = process.env.DEPLOY_RESTART_CMD?.trim();
  if (custom) {
    await runInBackend(custom);
    console.log(`✅ ${stepLabel}: DEPLOY_RESTART_CMD ejecutado\n`);
    return;
  }
  try {
    await runInBackend("pm2 restart multacheck");
    console.log(`✅ ${stepLabel}: pm2 restart multacheck\n`);
  } catch (err) {
    console.warn(
      `⚠️ ${stepLabel}: pm2 falló (${err.message}). Definí DEPLOY_RESTART_CMD en .env.\n`
    );
    throw err;
  }
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data.status === "healthy";
  } catch {
    return false;
  }
}

async function safeDeploy() {
  console.log("🚀 SAFE DEPLOY STARTED\n");

  let repoRoot;
  try {
    repoRoot = await gitRootDir();
  } catch {
    console.error(
      "❌ No es un repo git (git rev-parse --show-toplevel falló). Abortando."
    );
    process.exit(1);
  }

  console.log("1️⃣ Creating backup...");
  const { stdout: currentCommit } = await execAsync("git rev-parse HEAD", {
    cwd: repoRoot,
  });
  const backup = currentCommit.trim();
  console.log(`✅ Backup point: ${backup.slice(0, 7)}\n`);

  console.log("2️⃣ Running tests...");
  try {
    await runInBackend("npm run test:critical");
    console.log("✅ Tests passed\n");
  } catch (e) {
    console.error("❌ Tests failed, aborting deploy");
    if (e.stderr) console.error(String(e.stderr));
    process.exit(1);
  }

  const aiMode = String(process.env.AI_PROVIDER || "")
    .trim()
    .toLowerCase();
  if (aiMode === "openai") {
    console.log("3️⃣ Building AI...");
    await runInBackend("npm run build:ai");
    console.log("✅ Build complete\n");
  } else {
    console.log("3️⃣ AI build skipped (AI_PROVIDER !== openai)\n");
  }

  console.log("4️⃣ Deploying (restart)...");
  try {
    await restartProcess("Deploy");
  } catch {
    console.error("❌ No se pudo reiniciar el proceso; rollback omitido.");
    process.exit(1);
  }

  console.log("5️⃣ Waiting for startup...");
  await new Promise((r) => setTimeout(r, 5000));

  const healthy = await checkHealth();

  if (!healthy) {
    console.error("❌ HEALTH CHECK FAILED - ROLLING BACK");
    try {
      await execAsync(`git reset --hard ${backup}`, { cwd: repoRoot });
      console.log(`✅ Git rolled back to ${backup.slice(0, 7)}`);
      await restartProcess("Rollback");
      console.log("✅ Process restarted after rollback\n");
    } catch (err) {
      console.error("💥 Rollback error:", err.message);
      if (err.stderr) console.error(String(err.stderr));
    }
    process.exit(1);
  }

  console.log("✅ Health check passed\n");
  console.log("🎉 DEPLOY SUCCESSFUL\n");
}

safeDeploy().catch((err) => {
  console.error("💥 CRITICAL ERROR:", err.message);
  if (err.stderr) console.error(String(err.stderr));
  process.exit(1);
});
