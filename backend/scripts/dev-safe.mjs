import { spawn } from "node:child_process";
import {
  PORT as REQUESTED_PORT,
  multacheckAutoIncrementPortEnabled,
  multacheckAutoIncrementMax,
} from "../src/config/env.js";

/** Base `/api` detectada tras health (para MULTACHECK_API en E2E si el puerto no es el oficial). */
let discoveredApiBase = null;

/** Instancia propia del backend (solo si este script la arrancó). */
let spawnedServer = null;

function healthEndpoints() {
  const maxOff = multacheckAutoIncrementPortEnabled()
    ? multacheckAutoIncrementMax()
    : 0;
  const list = [];
  for (let off = 0; off <= maxOff; off++) {
    const port = REQUESTED_PORT + off;
    if (port > 65535) break;
    list.push(`http://127.0.0.1:${port}/api/health`);
  }
  return list;
}

async function tryHealthOnce() {
  for (const url of healthEndpoints()) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const hostPort = new URL(url);
      discoveredApiBase = `http://${hostPort.hostname}:${hostPort.port}/api`;
      return json;
    } catch (_) {}
  }
  return null;
}

function startServer() {
  return spawn("node", ["src/server.js"], {
    stdio: "inherit",
    shell: true,
  });
}

function runE2E() {
  return new Promise((resolve, reject) => {
    console.log("\n🧪 Ejecutando E2E...\n");

    const env = { ...process.env };
    if (discoveredApiBase) env.MULTACHECK_API = discoveredApiBase;

    const e2e = spawn("node", ["scripts/run-e2e.mjs"], {
      stdio: "inherit",
      shell: true,
      env,
    });

    e2e.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ E2E OK");
        resolve();
      } else {
        reject(new Error(`❌ E2E falló con código ${code}`));
      }
    });
  });
}

async function waitForHealth(maxRetries = 30, interval = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    const json = await tryHealthOnce();
    if (json) {
      console.log("\n✅ HEALTH OK:", json);
      console.log(`   API para E2E: ${discoveredApiBase}`);
      return true;
    }

    process.stdout.write(`⏳ esperando backend... (${i + 1}/${maxRetries})\r`);
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("❌ Backend no respondió health en tiempo límite");
}

async function main() {
  const initial = await tryHealthOnce();
  if (initial) {
    console.log(
      `\n[INFO] Backend ya responde — reutilizando ${discoveredApiBase} (no se lanza otra instancia).\n`
    );
    console.log("✅ HEALTH OK:", initial);
  } else {
    console.log("\n[INFO] Arrancando backend (node src/server.js)…\n");
    spawnedServer = startServer();
    await waitForHealth();
  }

  await runE2E();

  console.log("\n🚀 Flujo completo OK (backend + e2e)");

  if (spawnedServer) {
    spawnedServer.kill();
    spawnedServer = null;
  }
}

main().catch((err) => {
  console.error("\n", err.message);
  if (spawnedServer) spawnedServer.kill();
  process.exit(1);
});
