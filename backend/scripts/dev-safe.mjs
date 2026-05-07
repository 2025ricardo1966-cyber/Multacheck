import { spawn } from "node:child_process";

const BASE_URL = "http://127.0.0.1:3000/api/health";

function startServer() {
  const child = spawn("node", ["src/server.js"], {
    stdio: "inherit",
    shell: true,
  });
  return child;
}

function runE2E() {
  return new Promise((resolve, reject) => {
    console.log("\n🧪 Ejecutando E2E...\n");

    const e2e = spawn("node", ["scripts/run-e2e.mjs"], {
      stdio: "inherit",
      shell: true,
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
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) {
        const json = await res.json();
        console.log("\n✅ HEALTH OK:", json);
        return true;
      }
    } catch (_) {}

    process.stdout.write(`⏳ esperando backend... (${i + 1}/${maxRetries})\r`);
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("❌ Backend no respondió health en tiempo límite");
}

const server = startServer();

waitForHealth()
  .then(() => runE2E())
  .then(() => {
    console.log("\n🚀 Flujo completo OK (backend + e2e)");
  })
  .catch((err) => {
    console.error("\n", err.message);
    server.kill();
    process.exit(1);
  });