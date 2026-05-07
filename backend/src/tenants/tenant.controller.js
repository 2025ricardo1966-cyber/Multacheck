import bcrypt from "bcryptjs";
import * as tenantService from "./tenant.service.js";
import * as userService from "../users/user.service.js";
import { logAudit } from "../audit/audit.service.js";

export async function getCurrentTenant(req, res) {
  res.json({
    tenant: {
      id: req.tenant.id,
      name: req.tenant.name,
      slug: req.tenant.slug,
      subscriptionTier: req.tenant.subscriptionTier,
      subscriptionStatus: req.tenant.subscriptionStatus,
      subscriptionPeriodEnd: req.tenant.subscriptionPeriodEnd,
      settings: req.tenant.settings,
    },
  });
}

export async function patchTenantSettings(req, res) {
  try {
    const updated = await tenantService.updateTenantSettings(req.tenant.id, {
      featureFlags: req.body?.featureFlags,
      experiments: req.body?.experiments,
      onboarding: req.body?.onboarding,
    });
    await logAudit({
      tenantId: req.tenant.id,
      userId: req.auth.userId,
      action: "tenant.settings.updated",
      metadata: { keys: Object.keys(req.body || {}) },
      ip: req.ip,
      headers: req.headers,
    });
    res.json({ settings: updated.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** Alta de usuario dentro del mismo tenant (solo admin). */
export async function createTenantMember(req, res) {
  try {
    if (req.membership.role !== "admin") {
      return res.status(403).json({ error: "Sin permisos" });
    }

    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;
    const role = req.body?.role === "admin" ? "admin" : "user";

    if (!email || !password || password.length < 8) {
      return res.status(400).json({
        error: "Email y contraseña (mín. 8 caracteres) requeridos",
      });
    }

    const exists = await userService.findUserByEmailInTenant(
      email,
      req.tenant.id
    );
    if (exists) {
      return res.status(409).json({ error: "El email ya existe en la empresa" });
    }

    const hash = await bcrypt.hash(password, 12);
    const created = await userService.createUserInTenant({
      tenantId: req.tenant.id,
      email,
      passwordHash: hash,
      role,
    });

    await logAudit({
      tenantId: req.tenant.id,
      userId: req.auth.userId,
      action: "tenant.member.created",
      metadata: { targetEmail: email, role },
      ip: req.ip,
      headers: req.headers,
    });

    res.status(201).json({ user: userService.toPublicUser(created) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
