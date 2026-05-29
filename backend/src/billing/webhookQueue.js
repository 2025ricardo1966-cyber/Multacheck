import { logger } from "../config/logger.js";
import {
  listRecoverableWebhookInboxes,
  resetStaleProcessingWebhooks,
} from "./webhook.persistence.js";
import {
  processStripeWebhookJob,
  recordWebhookJobDeadLetter,
  StripeWebhookRetryError,
} from "./webhook.processor.js";

function cloneStripeEventForQueue(event) {
  try {
    return structuredClone(event);
  } catch {
    return JSON.parse(JSON.stringify(event));
  }
}

class WebhookQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxAttempts = 5;
    this.baseDelayMs = 800;
  }

  enqueue(rawEvent) {
    const event = cloneStripeEventForQueue(rawEvent);
    this.queue.push({
      id: event.id,
      type: event.type,
      event,
      attempts: 0,
      addedAt: Date.now(),
    });

    logger.info(
      { stripeEventId: event.id, type: event.type },
      "stripe_webhook_queued"
    );

    void this.#drain();
  }

  async #drain() {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];

        try {
          await processStripeWebhookJob(item.event);
          this.queue.shift();
          logger.info(
            { stripeEventId: item.id, type: item.type },
            "stripe_webhook_processed"
          );
        } catch (error) {
          item.attempts += 1;
          const retryable = error instanceof StripeWebhookRetryError;

          if (item.attempts >= this.maxAttempts || !retryable) {
            logger.error(
              {
                stripeEventId: item.id,
                type: item.type,
                attempts: item.attempts,
                retryable,
                error: error.message,
              },
              "stripe_webhook_abandoned"
            );
            recordWebhookJobDeadLetter(item.event, error);
            this.queue.shift();
          } else {
            logger.warn(
              {
                stripeEventId: item.id,
                type: item.type,
                attempt: item.attempts,
                error: error.message,
              },
              "stripe_webhook_retry"
            );
            const delay = this.baseDelayMs * item.attempts;
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        void this.#drain();
      }
    }
  }

  getStats() {
    const head = this.queue[0];
    return {
      pending: this.queue.length,
      processing: this.processing,
      oldestPendingMs:
        head?.addedAt != null ? Date.now() - head.addedAt : 0,
    };
  }
}

export const webhookQueue = new WebhookQueue();

/**
 * Reprocesa webhooks persistidos tras reinicio (cola in-memory perdida).
 */
export async function recoverPendingWebhooksFromDb() {
  const reset = await resetStaleProcessingWebhooks();
  if (reset > 0) {
    logger.warn(
      { reset },
      "stripe_webhook_inbox_stale_processing_reset"
    );
  }

  const rows = await listRecoverableWebhookInboxes(100);
  for (const row of rows) {
    try {
      webhookQueue.enqueue(row.payload);
    } catch (e) {
      logger.error(
        { stripeEventId: row.id, error: e?.message },
        "stripe_webhook_recovery_enqueue_failed"
      );
    }
  }

  if (rows.length > 0) {
    logger.info(
      { count: rows.length },
      "stripe_webhook_inbox_recovery_enqueued"
    );
  }

  return rows.length;
}
