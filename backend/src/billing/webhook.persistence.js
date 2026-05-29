import { prisma } from "../config/database.js";
import { safeTransaction } from "../db/safeTransaction.js";

export const WEBHOOK_INBOX_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  PROCESSED: "processed",
  FAILED: "failed",
});

const STALE_PROCESSING_MS = Number(
  process.env.STRIPE_WEBHOOK_STALE_PROCESSING_MS ?? 5 * 60 * 1000
);

export function findProcessedWebhookEvent(eventId) {
  return prisma.processedStripeWebhookEvent.findUnique({ where: { id: eventId } });
}

export function createProcessedWebhookEvent(eventId, eventType) {
  return prisma.processedStripeWebhookEvent.create({
    data: { id: eventId, eventType },
  });
}

export function findWebhookInbox(eventId) {
  return prisma.stripeWebhookInbox.findUnique({ where: { id: eventId } });
}

/**
 * Persiste el evento verificado antes del ACK HTTP (idempotente).
 * No sobrescribe filas ya procesadas ni en curso.
 */
export async function persistWebhookInboxFromStripeEvent(event) {
  const payload = JSON.parse(JSON.stringify(event));
  const existing = await findWebhookInbox(event.id);

  if (existing?.status === WEBHOOK_INBOX_STATUS.PROCESSED) {
    return { duplicate: true, inbox: existing };
  }

  if (existing) {
    return {
      duplicate: false,
      inbox: existing,
      created: false,
    };
  }

  try {
    const inbox = await prisma.stripeWebhookInbox.create({
      data: {
        id: event.id,
        eventType: event.type,
        payload,
        status: WEBHOOK_INBOX_STATUS.PENDING,
      },
    });
    return { duplicate: false, inbox, created: true };
  } catch (e) {
    if (e?.code !== "P2002") throw e;
    const raced = await findWebhookInbox(event.id);
    return { duplicate: raced?.status === WEBHOOK_INBOX_STATUS.PROCESSED, inbox: raced, created: false };
  }
}

/**
 * Reclama el evento para procesamiento (evita doble finalize en concurrencia).
 */
export async function claimWebhookInboxForProcessing(eventId) {
  return safeTransaction(async (tx) => {
    const processed = await tx.processedStripeWebhookEvent.findUnique({
      where: { id: eventId },
    });
    if (processed) {
      return { kind: "already_processed" };
    }

    const row = await tx.stripeWebhookInbox.findUnique({ where: { id: eventId } });
    if (!row) {
      return { kind: "missing" };
    }

    if (row.status === WEBHOOK_INBOX_STATUS.PROCESSED) {
      return { kind: "already_processed" };
    }

    if (row.status === WEBHOOK_INBOX_STATUS.PROCESSING) {
      return { kind: "in_flight" };
    }

    const claimed = await tx.stripeWebhookInbox.update({
      where: { id: eventId },
      data: {
        status: WEBHOOK_INBOX_STATUS.PROCESSING,
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    return { kind: "claimed", inbox: claimed };
  });
}

export async function markWebhookInboxProcessed(eventId) {
  return safeTransaction(async (tx) => {
    await tx.stripeWebhookInbox.update({
      where: { id: eventId },
      data: {
        status: WEBHOOK_INBOX_STATUS.PROCESSED,
        processedAt: new Date(),
        lastError: null,
      },
    });

    const inbox = await tx.stripeWebhookInbox.findUnique({ where: { id: eventId } });
    if (inbox) {
      try {
        await tx.processedStripeWebhookEvent.create({
          data: { id: eventId, eventType: inbox.eventType },
        });
      } catch (e) {
        if (e?.code !== "P2002") throw e;
      }
    }
  });
}

export async function markWebhookInboxFailed(eventId, errorMessage) {
  return prisma.stripeWebhookInbox.update({
    where: { id: eventId },
    data: {
      status: WEBHOOK_INBOX_STATUS.FAILED,
      lastError: String(errorMessage ?? "unknown").slice(0, 2000),
    },
  });
}

export async function resetStaleProcessingWebhooks() {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const result = await prisma.stripeWebhookInbox.updateMany({
    where: {
      status: WEBHOOK_INBOX_STATUS.PROCESSING,
      receivedAt: { lt: staleBefore },
    },
    data: { status: WEBHOOK_INBOX_STATUS.PENDING },
  });
  return result.count;
}

export async function listRecoverableWebhookInboxes(limit = 50) {
  return prisma.stripeWebhookInbox.findMany({
    where: {
      status: {
        in: [WEBHOOK_INBOX_STATUS.PENDING, WEBHOOK_INBOX_STATUS.FAILED],
      },
    },
    orderBy: { receivedAt: "asc" },
    take: limit,
  });
}
