import * as authService from "./auth.service.js";
import * as userService from "../users/user.service.js";
import { logAudit } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.model.js";

export async function register(req, res) {
  try {
    const { email, password, companyName, companySlug } = req.body ?? {};
    if (!companyName?.trim()) {
      return res.status(400).json({ error: "companyName is required" });
    }
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const { token, user } = await authService.register({
      email,
      password,
      companyName,
      companySlug,
    });
    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: AuditAction.AUTH_REGISTER_SUCCESS,
      metadata: { email: user.email, tenantSlug: user.tenantSlug },
      ip: req.ip,
      headers: req.headers,
    });
    res.status(201).json({ token, user });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { token, user } = await authService.login(req.body);
    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: AuditAction.AUTH_LOGIN_SUCCESS,
      metadata: { email: user.email },
      ip: req.ip,
      headers: req.headers,
    });
    res.json({ token, user });
  } catch (err) {
    await logAudit({
      tenantId: null,
      userId: "system",
      action: AuditAction.AUTH_LOGIN_FAILURE,
      metadata: {
        email: req.body?.email,
        tenantSlug: req.body?.tenantSlug,
      },
      ip: req.ip,
      headers: req.headers,
    });
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
}

export async function me(req, res) {
  const row = await userService.findUserByAuthContext(req.auth);
  res.json({ user: userService.toPublicUser(row) });
}

export async function logout(req, res) {
  await logAudit({
    tenantId: req.tenant.id,
    userId: req.auth.userId,
    action: AuditAction.AUTH_LOGOUT,
    ip: req.ip,
    headers: req.headers,
  });
  res.status(204).send();
}
