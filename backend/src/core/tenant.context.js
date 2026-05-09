import { securityLog } from "../multas/multa.securitylog.js";
import { findTenantMembership } from "./tenant.persistence.js";

/**
 * Resuelve la empresa del JWT y adjunta `req.tenant` + `req.membership` (usuario DB).
 * Obligatorio tras authenticateJWT en rutas de negocio.
 */
export async function attachTenantContext(req, res, next) {
  try {
    const tenantIdFromJwt = req.auth?.tenantId;

    const userRow = await findTenantMembership(req.auth.userId, tenantIdFromJwt);

    if (!userRow) {
      securityLog("UNAUTHORIZED_ACCESS_ATTEMPT", {
        reason: "user_not_member_of_tenant",
        path: req.originalUrl || req.path,
        method: req.method,
        userId: req.auth?.userId ?? null,
        tenantId: tenantIdFromJwt,
      });
      return res.status(401).json({ error: "Usuario no válido para este tenant" });
    }

    if (userRow.status !== "active") {
      securityLog("UNAUTHORIZED_ACCESS_ATTEMPT", {
        reason: "user_inactive_or_suspended",
        path: req.originalUrl || req.path,
        method: req.method,
        userId: req.auth.userId,
        tenantId: tenantIdFromJwt,
      });
      return res.status(403).json({
        error: "Usuario inactivo o suspendido",
        code: "USER_INACTIVE",
      });
    }

    req.membership = userRow;
    req.tenant = userRow.tenant;
    next();
  } catch (err) {
    next(err);
  }
}

/** Solo resuelve tenant si ya hay `req.auth` (p. ej. tras JWT opcional). */
export function attachTenantContextIfAuthenticated(req, res, next) {
  if (!req.auth) return next();
  return attachTenantContext(req, res, next).catch(next);
}
