import jwt from "jsonwebtoken";
import { securityLog } from "../multas/multa.securitylog.js";
import { assertAuthContext } from "./auth.context.js";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no configurado");
  }
  return secret;
}

export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  const token =
    header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      const userHdr = req.headers["x-dev-user"];
      const tenantHdr = req.headers["x-dev-tenant"];
      if (
        userHdr != null &&
        tenantHdr != null &&
        typeof userHdr === "string" &&
        typeof tenantHdr === "string"
      ) {
        const userId = userHdr.trim();
        const tenantId = tenantHdr.trim();
        try {
          assertAuthContext({ userId, tenantId, authType: "jwt" });
          req.auth = Object.freeze({
            userId,
            tenantId,
            authType: "dev",
          });
          return next();
        } catch {
          /* fall through to NO_TOKEN */
        }
      }
    }

    securityLog("UNAUTHORIZED_ACCESS_ATTEMPT", {
      reason: "missing_bearer_token",
      path: req.originalUrl || req.path,
      method: req.method,
    });
    return res.status(401).json({ error: "No autorizado", code: "NO_TOKEN" });
  }

  try {
    const payload = jwt.verify(token, getSecret());
    req.auth = Object.freeze({
      userId: payload.userId,
      tenantId: payload.tenantId,
      authType: "jwt",
    });
    if (!payload?.userId || !payload?.tenantId) {
      throw new Error("Missing authenticated user context");
    }
    req.auth = Object.freeze(assertAuthContext(req.auth));
    next();
  } catch (err) {
    const reason =
      err?.message === "Missing authenticated user context"
        ? "jwt_missing_auth_context_fields"
        : "invalid_or_expired_token";
    securityLog("UNAUTHORIZED_ACCESS_ATTEMPT", {
      reason,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    return res
      .status(401)
      .json({ error: "Missing authenticated user context", code: "INVALID_TOKEN" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.membership?.role;
    if (!req.auth || !role || !roles.includes(role)) {
      return res.status(403).json({ error: "Sin permisos", code: "FORBIDDEN" });
    }
    next();
  };
}
