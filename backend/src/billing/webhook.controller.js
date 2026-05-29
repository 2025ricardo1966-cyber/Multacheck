import Stripe from "stripe";
import { getStripe } from "./stripe.service.js";
import { logger, logError } from "../config/logger.js";
import {
  findProcessedWebhookEvent,
  persistWebhookInboxFromStripeEvent,
} from "./webhook.persistence.js";
import { webhookQueue } from "./webhookQueue.js";

export async function handleStripeWebhook(req, res) {
  /** Verificación HMAC solo exige el signing secret; el SDK de Stripe no hace falta en esta capa. */
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    logger.warn(
      {
        context: "stripe_webhook",
        phase: "reject_config",
        signingSecretConfigured: false,
      },
      "stripe_webhook_missing_signing_secret"
    );
    return res.status(503).send("Billing no configurado");
  }

  const stripeSdk = getStripe();
  if (!stripeSdk) {
    logger.warn(
      {
        context: "stripe_webhook",
        phase: "warn_async_processor",
      },
      "stripe_webhook_processor_requires_secret_key"
    );
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      logger.warn(
        { context: "stripe_webhook", phase: "reject_body", bodyType: typeof rawBody },
        "stripe_webhook_invalid_body"
      );
      return res.status(400).send("Webhook payload inválido");
    }
    if (!sig || typeof sig !== "string") {
      logger.warn(
        { context: "stripe_webhook", phase: "reject_signature_header" },
        "stripe_webhook_missing_signature"
      );
      return res.status(400).send("Missing Stripe-Signature");
    }
    event = Stripe.webhooks.constructEvent(rawBody, sig, secret);
    logger.info(
      {
        context: "stripe_webhook",
        phase: "verified",
        stripeEventId: event.id,
        type: event.type,
      },
      "stripe_webhook_signature_ok"
    );
  } catch (err) {
    logError("stripe_webhook", err, { phase: "signature_verification" });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const alreadyProcessed = await findProcessedWebhookEvent(event.id);
    if (alreadyProcessed) {
      logger.info(
        {
          context: "stripe_webhook",
          phase: "duplicate_http",
          stripeEventId: event.id,
          type: event.type,
        },
        "stripe_webhook_duplicate_skipped"
      );
      return res.json({ received: true, duplicate: true });
    }

    const persisted = await persistWebhookInboxFromStripeEvent(event);
    if (persisted.duplicate) {
      logger.info(
        {
          context: "stripe_webhook",
          phase: "duplicate_inbox",
          stripeEventId: event.id,
          type: event.type,
        },
        "stripe_webhook_inbox_duplicate"
      );
      return res.json({ received: true, duplicate: true });
    }

    logger.info(
      {
        context: "stripe_webhook",
        phase: "ack",
        stripeEventId: event.id,
        type: event.type,
        inboxCreated: persisted.created,
      },
      "stripe_webhook_ack"
    );

    /** ACK a Stripe; el payload ya está en DB (StripeWebhookInbox). */
    res.status(200).json({ received: true });
    setImmediate(() => {
      try {
        webhookQueue.enqueue(event);
      } catch (enqueueErr) {
        logError("stripe_webhook", enqueueErr, {
          phase: "enqueue_sync",
          stripeEventId: event?.id,
          type: event?.type,
        });
      }
    });
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
