#!/usr/bin/env node
/**
 * Volcado diario con pg_dump. Ejecutar desde `backend`: `npm run backup`.
 * Requiere `pg_dump` en PATH (cliente PostgreSQL).
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

function runPgDump(connectionUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "pg_dump",
      ["-d", connectionUrl, "-F", "p", "--no-owner", "--no-acl", "-f", outputPath],
      {
        stdio: ["ignore", "inherit", "inherit"],
        env: process.env,
        cwd: backendRoot,
      }
    );
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited with code ${code}`));
    });
  });
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().split("T")[0];
  const backupDir = path.resolve(
    backendRoot,
    process.env.BACKUP_DIR?.trim() || "./backups"
  );
  const filename = `multacheck-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  console.log("Starting database backup...");

  await fs.mkdir(backupDir, { recursive: true });

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    throw new Error("DATABASE_URL not set");
  }

  await runPgDump(dbUrl, filepath);

  const stats = await fs.stat(filepath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`Backup created: ${filename} (${sizeMB} MB)`);

  const files = await fs.readdir(backupDir);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort().reverse();

  for (const file of sqlFiles.slice(7)) {
    await fs.unlink(path.join(backupDir, file));
    console.log(`Deleted old backup: ${file}`);
  }

  console.log("Backup complete.");
}

backupDatabase().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
