import fs from "node:fs/promises";
import path from "node:path";
import { getGatewayAuditPath } from "./config.js";

/**
 * @param {Record<string, unknown>} row
 */
export async function appendGatewayAudit(row) {
  try {
    const filePath = getGatewayAuditPath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(row)}\n`, "utf8");
  } catch (e) {
    console.error("[securityGateway] audit append failed:", e?.message ?? e);
  }
}
