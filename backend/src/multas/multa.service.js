import prisma from "../db/prisma.js";
import * as persistence from "./multa.persistence.js";
import stripe from "../billing/stripe.service.js";

/**
 * =========================================================
 * MULTA SERVICE - BUSINESS ORCHESTRATION LAYER
 * =========================================================
 */

function frontendBaseUrl() {
  return (
    process.env.FRONTEND_URL?.trim() ||
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:5173"
  );
}

function httpError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function findOwnedMulta(auth, multaId) {
  if (!multaId) return null;
  return prisma.multa.findFirst({
    where: {
      id: multaId,
      tenantId: auth.tenantId,
      userId: auth.userId,
    },
  });
}

export async function createMultaFlow(auth, body, options = {}) {
  // 1. Persistencia blindada (única fuente de verdad)
  const result = await persistence.analyzeAndPersist(auth, body, options);

  // 2. Integración externa opcional (Stripe)
  if (options?.createCheckout) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MultaCheck Service",
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
    });

    return {
      ...result,
      checkoutSession: session,
    };
  }

  return result;
}

export async function createDischargeCheckoutFlow(auth, multaId, body = {}) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  if (!stripe.checkout?.sessions) {
    throw httpError("Stripe no configurado", 503);
  }

  const base = frontendBaseUrl();
  const successUrl =
    typeof body?.successUrl === "string"
      ? body.successUrl
      : `${base}/dashboard?multa=${encodeURIComponent(multa.id)}&payment=success`;
  const cancelUrl =
    typeof body?.cancelUrl === "string"
      ? body.cancelUrl
      : `${base}/dashboard?multa=${encodeURIComponent(multa.id)}&payment=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "MultaCheck discharge report",
          },
          unit_amount: 1000,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      multaId: multa.id,
      tenantId: auth.tenantId,
    },
  });

  await prisma.multa.update({
    where: { id: multa.id },
    data: {
      stripeCheckoutSessionId: session.id,
      traceCheckoutAt: new Date(),
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function getPaymentStatusFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return {
    paid: multa.paid,
    paymentStatus: multa.paymentStatus,
    stripeCheckoutSessionId: multa.stripeCheckoutSessionId,
  };
}

export async function getMultaStateFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return {
    id: multa.id,
    lifecycleState: multa.lifecycleState,
    paid: multa.paid,
    paymentStatus: multa.paymentStatus,
  };
}

export async function getMultaFullStateFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return multa;
}

export async function getDischargeFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return {
    dischargeBody: multa.dischargeBody,
    paid: multa.paid,
    paymentStatus: multa.paymentStatus,
  };
}
