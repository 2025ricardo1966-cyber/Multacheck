import Stripe from "stripe";
import { getStripe, syncStripeSubscription } from "./stripe.service.js";
import { logAudit } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.model.js";
import { isFeatureReportGenerationEnabled } from "../config/launchflags.js";
import {
  recordReportGenerationBlocked,
  recordWebhookFailure,
} from "../infra/launchhealth.js";
import * as multaPersistence from "../multas/multa.persistence.js";
import { multaFlowLog } from "../multas/multa.debuglog.js";
import { CaseState } from "../multas/multaCaseState.js";
import prisma from "../db/prisma.js";
import {
  createProcessedWebhookEvent,
  findProcessedWebhookEvent,
} from "./webhook.persistence.js";

export async function handleStripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();

  if (!stripe || !secret) {
    console.error("[stripe webhook] Falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET");
    return res.status(503).send("Billing no configurado");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).send("Webhook payload inválido");
    }
    if (!sig || typeof sig !== "string") {
      return res.status(400).send("Missing Stripe-Signature");
    }
    event = Stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] firma:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const alreadyProcessed = await findProcessedWebhookEvent(event.id);
    if (alreadyProcessed) {
      multaFlowLog("STRIPE_WEBHOOK_DUPLICATE_DELIVERY", {
        stripeEventId: event.id,
        type: event.type,
      });
      return res.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const multaIdRaw = session.metadata?.multaId;
        const multaId =
          typeof multaIdRaw === "string" && multaIdRaw.trim().length > 0
            ? multaIdRaw.trim()
            : null;

        const isDischargePayment =
          session.mode === "payment" &&
          session.payment_status === "paid" &&
          multaId != null;

        if (isDischargePayment) {
          if (!isFeatureReportGenerationEnabled()) {
            recordReportGenerationBlocked();
            multaFlowLog("REPORT_GEN_DISABLED_WEBHOOK_RETRY", {
              multaId,
              stripeEventId: event.id,
            });
            return res.status(503).json({
              error: "report_generation_disabled",
              code: "FEATURE_REPORT_DISABLED",
            });
          }

          const pi = session.payment_intent;
          const paymentIntentId =
            typeof pi === "string"
              ? pi
              : pi && typeof pi === "object" && "id" in pi
                ? String(pi.id)
                : null;

          let finalized =
            await multaPersistence.finalizeMultaDischargeFromWebhook(multaId, {
              stripeSessionId: session.id,
              paymentIntentId,
            });
          if (!finalized) {
            finalized =
              await multaPersistence.reconcileMultaDischargeFromStripeSession(
                session.id
              );
          }
          if (!finalized) {
            multaFlowLog("PAYMENT_WEBHOOK_FINALIZE_FAILED", {
              multaId,
              stripeCheckoutSessionId: session.id,
            });
            return res.status(500).json({
              error: "multa_finalize_failed",
              code: "FINALIZE_NOOP",
            });
          }
          break;
        }

        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
          );
          await syncStripeSubscription(sub);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const multaIdRaw = session.metadata?.multaId;
        const mid =
          typeof multaIdRaw === "string" && multaIdRaw.trim().length > 0
            ? multaIdRaw.trim()
            : null;
        if (mid && session.mode === "payment") {
          await prisma.multa.updateMany({
            where: { id: mid, caseState: CaseState.PAYMENT_PENDING },
            data: { caseState: CaseState.FAILED },
          });
          multaFlowLog("CHECKOUT_SESSION_NOT_PAID", {
            multaId: mid,
            type: event.type,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncStripeSubscription(event.data.object);
        break;
      }
      default:
        break;
    }

    const md = event.data.object.metadata || {};
    const webhookTenantId =
      md.tenantId && typeof md.tenantId === "string" ? md.tenantId : null;

    await logAudit({
      tenantId: webhookTenantId,
      userId: "system",
      action: AuditAction.BILLING_WEBHOOK_PROCESSED,
      metadata: { type: event.type, id: event.id },
    });

    try {
      await createProcessedWebhookEvent(event.id, event.type);
    } catch (e) {
      if (e?.code !== "P2002") {
        throw e;
      }
      multaFlowLog("STRIPE_WEBHOOK_DUPLICATE_DELIVERY", {
        stripeEventId: event.id,
        note: "create_race",
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] handler:", err);
    recordWebhookFailure();
    res.status(500).json({ error: err.message });
  }
}
