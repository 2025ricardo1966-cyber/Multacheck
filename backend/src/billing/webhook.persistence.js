import { prisma } from "../config/database.js";

export function findProcessedWebhookEvent(eventId) {
  return prisma.processedStripeWebhookEvent.findUnique({ where: { id: eventId } });
}

export function createProcessedWebhookEvent(eventId, eventType) {
  return prisma.processedStripeWebhookEvent.create({
    data: { id: eventId, eventType },
  });
}
