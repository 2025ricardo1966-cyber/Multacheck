import Stripe from "stripe";
import { getStripe } from "./stripe.service.js";
import { logError } from "../config/logger.js";
import { findProcessedWebhookEvent } from "./webhook.persistence.js";
import { webhookQueue } from "./webhookQueue.js";

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
    logError("stripe_webhook", err, { phase: "signature_verification" });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const alreadyProcessed = await findProcessedWebhookEvent(event.id);
    if (alreadyProcessed) {
      return res.json({ received: true, duplicate: true });
    }

    /** ACK rápido a Stripe; el trabajo pesado va en cola (reintentos internos). */
    res.status(200).json({ received: true });
    setImmediate(() => webhookQueue.enqueue(event));
  } catch (err) {
    logError("stripe_webhook", err, {
      phase: "webhook_ack_enqueue",
      event: event?.type,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
}
