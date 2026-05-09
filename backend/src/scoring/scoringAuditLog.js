/**
 * Registro append-only de auditoría de scoring (JSONL).
 * Solo cuando MULTACHECK_SCORING_TRACE=1 escribe multaservice.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultAuditPath() {
  const override = process.env.MULTACHECK_SCORING_AUDIT_PATH?.trim();
  if (override) return path.resolve(override);
  return path.join(__dirname, "../../logs/scoring-audit.jsonl");
}

/**
 * @param {Record<string, unknown>} record
 */
export function appendScoringAuditRecord(record) {
  const filePath = defaultAuditPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const line = `${JSON.stringify({ ts: new Date().toISOString(), ...record })}\n`;
  fs.appendFileSync(filePath, line, "utf8");
}
