import fs from "node:fs/promises";
import path from "node:path";
import { getOrchestratorAuditPath } from "./config.js";

/**
 * Append one JSON line (failure-safe — never throws to callers).
 * @param {Record<string, unknown>} record
 */
export async function appendAnalyzeOrchestratorAudit(record) {
  try {
    const filePath = getOrchestratorAuditPath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
  } catch (e) {
    console.error("[requestOrchestrator] audit append failed:", e?.message ?? e);
  }
}
