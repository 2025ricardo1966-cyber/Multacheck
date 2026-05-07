/**
 * Administrador dentro del tenant (no super-admin de plataforma).
 */
export function requireTenantAdmin(req, res, next) {
  if (req.membership?.role !== "admin") {
    return res.status(403).json({
      error: "Requiere rol administrador en la empresa",
      code: "TENANT_ADMIN_ONLY",
    });
  }
  next();
}
