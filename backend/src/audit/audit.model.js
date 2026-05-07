/** Constantes de acciones auditadas (un solo lugar para filtros / dashboards). */
export const AuditAction = Object.freeze({
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  AUTH_REGISTER_SUCCESS: "auth.register.success",
  AUTH_LOGOUT: "auth.logout",
  MULTA_ANALYZE_SUCCESS: "multa.analyze.success",
  MULTA_ANALYZE_FAILURE: "multa.analyze.failure",
  USAGE_LIMIT_EXCEEDED: "usage.limit_exceeded",
  BILLING_CHECKOUT_CREATED: "billing.checkout.created",
  BILLING_PORTAL_CREATED: "billing.portal.created",
  BILLING_WEBHOOK_PROCESSED: "billing.webhook.processed",
  BILLING_PLAN_UPDATED: "billing.plan.updated",
});
