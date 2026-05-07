import crypto from "crypto";

/**
 * Protege rutas operativas internas. Requiere ADMIN_DEBUG_SECRET y cabecera X-Admin-Debug-Token.
 */
export function requireAdminDebugSecret(req, res, next) {
  const expected = process.env.ADMIN_DEBUG_SECRET?.trim();
  if (!expected) {
    return res.status(503).json({
      error: "Admin debug no configurado",
      code: "ADMIN_DEBUG_DISABLED",
    });
  }

  const token = req.get("X-Admin-Debug-Token")?.trim() ?? "";
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(token, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Prohibido", code: "FORBIDDEN" });
  }
  next();
}
