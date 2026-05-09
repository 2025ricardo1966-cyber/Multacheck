import { logger } from "../config/logger.js";
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
