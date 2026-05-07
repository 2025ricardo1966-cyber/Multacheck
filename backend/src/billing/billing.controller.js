import * as stripeSvc from "./stripe.service.js";
import { logAudit } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.model.js";

function frontendBaseUrl() {
  return (
    process.env.FRONTEND_URL?.trim() ||
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:5173"
  );
}

function requireBillingAdmin(req, res) {
  if (req.membership.role !== "admin") {
    res.status(403).json({
      error: "Solo administradores de la empresa pueden gestionar facturación",
      code: "BILLING_ADMIN_ONLY",
    });
    return false;
  }
  return true;
}

export async function createCheckoutSession(req, res) {
  try {
    if (!requireBillingAdmin(req, res)) return;

    const stripe = stripeSvc.getStripe();
    if (!stripe) {
      return res.status(503).json({ error: "Billing no configurado (Stripe)" });
    }

    const tier = String(req.body?.tier || "").toLowerCase();
    if (tier !== "pro" && tier !== "enterprise") {
      return res.status(400).json({ error: "Plan inválido" });
    }

    const priceId = stripeSvc.getStripePriceIdForTier(tier);
    if (!priceId) {
      return res.status(503).json({
        error: `Falta STRIPE_PRICE_${tier.toUpperCase()} en entorno`,
      });
    }

    const tenant = req.tenant;
    const customerId = await stripeSvc.ensureStripeCustomerForTenant(
      tenant,
      req.membership.email
    );
    const base = frontendBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard?billing=success`,
      cancel_url: `${base}/plans?billing=cancel`,
      metadata: {
        tenantId: tenant.id,
        targetTier: tier,
      },
      subscription_data: {
        metadata: {
          tenantId: tenant.id,
          targetTier: tier,
        },
      },
      client_reference_id: tenant.id,
    });

    await logAudit({
      tenantId: tenant.id,
      userId: req.auth.userId,
      action: AuditAction.BILLING_CHECKOUT_CREATED,
      metadata: { tier, checkoutSessionId: session.id },
      ip: req.ip,
      headers: req.headers,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[billing] checkout:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function createPortalSession(req, res) {
  try {
    if (!requireBillingAdmin(req, res)) return;

    const stripe = stripeSvc.getStripe();
    if (!stripe) {
      return res.status(503).json({ error: "Billing no configurado (Stripe)" });
    }

    const tenant = req.tenant;
    if (!tenant?.stripeCustomerId) {
      return res.status(400).json({ error: "No hay cliente de facturación" });
    }

    const base = frontendBaseUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${base}/plans`,
    });

    await logAudit({
      tenantId: tenant.id,
      userId: req.auth.userId,
      action: AuditAction.BILLING_PORTAL_CREATED,
      metadata: {},
      ip: req.ip,
      headers: req.headers,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[billing] portal:", err);
    res.status(500).json({ error: err.message });
  }
}
