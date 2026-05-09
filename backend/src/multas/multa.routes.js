import { Router } from "express";
import {
  createDischargeCheckout,
  getPaymentStatus,
  getMultaState,
  getMultaFullState,
  getDischarge,
} from "./multa.controller.js";
import { checkoutRateLimit } from "../middleware/launchratelimit.js";

const router = Router();

/**
 * @swagger
 * /multa/{multaId}/discharge-checkout:
 *   post:
 *     summary: Crea sesión Stripe Checkout para descargo
 *     tags: [Multas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: multaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesión de checkout (URL de pago en payload según implementación)
 */
router.post(
  "/multa/:multaId/discharge-checkout",
  checkoutRateLimit,
  createDischargeCheckout
);
/**
 * @swagger
 * /multa/{multaId}/payment-status:
 *   get:
 *     summary: Estado de pago del caso
 *     tags: [Multas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: multaId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/multa/:multaId/payment-status", getPaymentStatus);

/**
 * @swagger
 * /multa/{multaId}/state:
 *   get:
 *     summary: Estado operativo del caso (caseState)
 *     tags: [Multas]
 *     security:
 *       - bearerAuth: []
 */
router.get("/multa/:multaId/state", getMultaState);
router.get(
  "/multa/:multaId/full-state",
  getMultaFullState
);
/**
 * @swagger
 * /multa/{multaId}/discharge:
 *   get:
 *     summary: Obtiene el cuerpo del informe / descargo (si está listo)
 *     tags: [Multas]
 *     security:
 *       - bearerAuth: []
 */
router.get("/multa/:multaId/discharge", getDischarge);

export default router;
