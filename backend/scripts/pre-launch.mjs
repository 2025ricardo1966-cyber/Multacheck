#!/usr/bin/env node
/**
 * Checklist pre-lanzamiento (ejecutar desde la carpeta backend vía npm run prelaunch).
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

function runNpm(script) {
  return execAsync(`npm run ${script}`, {
    cwd: backendRoot,
    env: process.env,
  });
}

/** Orden explícito (Object.entries no garantiza orden si se refactoriza). */
const checks = [
  [
    "✅ .env existe",
    async () => {
      await fs.access(path.join(backendRoot, ".env"));
    },
  ],

  [
    "✅ Variables cargadas desde .env",
    async () => {
      const envPath = path.join(backendRoot, ".env");
      const result = dotenv.config({ path: envPath });
      if (result.error) throw result.error;
    },
  ],

  [
    "✅ DATABASE_URL configurado",
    async () => {
      if (!process.env.DATABASE_URL?.trim()) throw new Error("Missing");
    },
  ],

  [
    "✅ JWT_SECRET configurado",
    async () => {
      const s = process.env.JWT_SECRET?.trim() ?? "";
      if (s.length < 20) throw new Error("Weak or missing");
    },
  ],

  [
    "✅ Stripe configurado",
    async () => {
      if (!process.env.STRIPE_SECRET_KEY?.trim()) throw new Error("Missing");
    },
  ],

  [
    "✅ DB conecta",
    async () => {
      const prismaHref = pathToFileURL(
        path.join(backendRoot, "src/db/prisma.js")
      ).href;
      const { default: prisma } = await import(prismaHref);
      try {
        await prisma.$queryRaw`SELECT 1`;
      } finally {
        await prisma.$disconnect().catch(() => {});
      }
    },
  ],

  [
    "✅ Tests pasan",
    async () => {
      await runNpm("test:critical");
    },
  ],

  [
    "✅ No archivos legacy",
    async () => {
      const files = await fs.readdir(backendRoot);
      if (files.includes("_archive") || files.includes("Server_old.js")) {
        throw new Error("Clean up old files");
      }
    },
  ],

  [
    "✅ package.json tiene scripts críticos",
    async () => {
      const raw = await fs.readFile(
        path.join(backendRoot, "package.json"),
        "utf8"
      );
      const pkg = JSON.parse(raw);
      const required = ["start", "test:critical", "deploy"];
      const missing = required.filter((s) => !pkg.scripts?.[s]);
      if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
    },
  ],
];

console.log("🔍 PRE-LAUNCH CHECKLIST\n");

let passed = 0;
let failed = 0;

for (const [name, check] of checks) {
  try {
    await check();
    console.log(name);
    passed++;
  } catch (e) {
    const label = name.replace(/^\s*✅\s*/, "").trim();
    console.log(`❌ ${label}: ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed}/${checks.length} checks passed\n`);

if (failed > 0) {
  console.error("🚫 NOT READY FOR LAUNCH");
  process.exit(1);
}

console.log("🚀 READY TO LAUNCH!\n");
