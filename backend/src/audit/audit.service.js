import { enqueueBackground } from "../infra/queue.js";
import { createAuditLog } from "./audit.persistence.js";

function clientIp(ip, headers) {
  const xf = headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return ip ?? null;
}

export async function logAudit({
  tenantId = null,
  userId = null,
  action,
  metadata = {},
  ip = null,
  headers = null,
}) {
  const payload = {
    tenantId,
    userId,
    action,
    metadata,
    ip: clientIp(ip, headers),
    userAgent: headers?.["user-agent"] ?? null,
  };

  enqueueBackground(async () => {
    try {
      await createAuditLog(payload);
    } catch (err) {
      console.error("[audit] fallo al registrar:", err.message);
    }
  });
}
