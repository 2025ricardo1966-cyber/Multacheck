#!/usr/bin/env node
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

/** Ejecuta comando en la raíz del backend (donde está package.json). */
function run(cmd) {
  return execAsync(cmd, {
    cwd: backendRoot,
    env: process.env,
  });
}

async function deploy() {
  console.log("🚀 DEPLOY MULTACHECK\n");

  console.log("1️⃣ Running tests...");
  await run("npm run test:critical");
  console.log("✅ Tests passed\n");

  const aiMode = String(process.env.AI_PROVIDER || "")
    .trim()
    .toLowerCase();
  if (aiMode === "openai") {
    console.log("2️⃣ Building AI pipeline...");
    await run("npm run build:ai");
    console.log("✅ AI compiled\n");
  } else {
    console.log("2️⃣ AI build skipped (AI_PROVIDER !== openai)\n");
  }

  console.log("3️⃣ Running migrations...");
  await run("npm run db:migrate");
  console.log("✅ DB updated\n");

  console.log("4️⃣ Restarting server...");
  const custom = process.env.DEPLOY_RESTART_CMD?.trim();
  if (custom) {
    await run(custom);
    console.log("✅ DEPLOY_RESTART_CMD ejecutado\n");
  } else {
    try {
      await run("pm2 restart multacheck");
      console.log("✅ Server restarted (pm2)\n");
    } catch (err) {
      console.warn("⚠️ pm2 restart multacheck falló:", err.message);
      console.warn(
        "   Definí DEPLOY_RESTART_CMD en .env o reiniciá el proceso en tu hosting.\n" +
          "   (No se ejecuta npm start aquí para no bloquear el script de deploy.)\n"
      );
    }
  }

  console.log("🎉 DEPLOY COMPLETED\n");
}

deploy().catch((err) => {
  console.error("❌ DEPLOY FAILED:", err.message);
  if (err.stderr) console.error(String(err.stderr));
  process.exit(1);
});
