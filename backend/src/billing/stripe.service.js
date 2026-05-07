import Stripe from "stripe";
import {
  getStripePriceIdForTier,
  getTierForStripePriceId,
} from "../plans/plan.config.js";
import { logAudit } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.model.js";
import {
  findTenantByStripeCustomerId,
  updateTenantStripeCustomerId,
  updateTenantSubscriptionState,
} from "./stripe.persistence.js";

let stripeSingleton = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeSingleton) stripeSingleton = new Stripe(key);
  return stripeSingleton;
}

export async function ensureStripeCustomerForTenant(tenantRow, billingEmail) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe no configurado");

  if (tenantRow.stripeCustomerId) return tenantRow.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: billingEmail,
    metadata: { tenantId: tenantRow.id },
  });

  await updateTenantStripeCustomerId(tenantRow.id, customer.id);

  return customer.id;
}

function normalizeTierFromSubscription(sub) {
  const priceId = sub.items?.data?.[0]?.price?.id;
  const mapped = getTierForStripePriceId(priceId);
  const metaTier = sub.metadata?.targetTier;
  const raw = mapped ?? metaTier;
  if (raw === "enterprise") return "enterprise";
  if (raw === "pro") return "pro";
  return "free";
}

/** Values persisted on Tenant.subscriptionTier (PostgreSQL enum, uppercase). */
function subscriptionTierForDb(raw) {
  const v = String(raw ?? "free").toLowerCase();
  if (v === "enterprise") return "ENTERPRISE";
  if (v === "pro") return "PRO";
  return "FREE";
}

export async function syncStripeSubscription(subscription) {
  const sub = subscription;
  let tenantId = sub.metadata?.tenantId;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  if (!tenantId && customerId) {
    const tenant = await findTenantByStripeCustomerId(customerId);
    tenantId = tenant?.id;
  }

  if (!tenantId) {
    console.warn("[stripe] Suscripción sin tenant enlazable:", sub.id);
    return;
  }

  const status = sub.status;
  const canceledLike =
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired";

  let resolvedTier = "free";

  if (canceledLike) {
    await updateTenantSubscriptionState(tenantId, {
      stripeSubscriptionId: null,
      subscriptionStatus: status,
      subscriptionTier: subscriptionTierForDb("FREE"),
      subscriptionPeriodEnd: null,
    });
    resolvedTier = "free";
  } else {
    resolvedTier = normalizeTierFromSubscription(sub);
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    await updateTenantSubscriptionState(tenantId, {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: status,
      subscriptionTier: subscriptionTierForDb(resolvedTier),
      subscriptionPeriodEnd: periodEnd,
    });
  }

  await logAudit({
    tenantId,
    userId: "system",
    action: AuditAction.BILLING_PLAN_UPDATED,
    metadata: {
      stripeSubscriptionId: sub.id,
      status,
      tier: resolvedTier,
    },
  });
}

export { getStripePriceIdForTier };

/** Stripe SDK namespaces for `import stripe from "./stripe.service.js"`. */
export default {
  get customers() {
    return getStripe()?.customers;
  },
  get checkout() {
    return getStripe()?.checkout;
  },
  get billingPortal() {
    return getStripe()?.billingPortal;
  },
};
