import { Router } from "express";
import { requireAdminDebugSecret } from "../admin/admin.middleware.js";
import * as healthController from "../controllers/healthcontroller.js";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check (DB, Stripe, IA)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio healthy
 *       503:
 *         description: Servicio degraded
 */
router.get("/health", healthController.getHealth);

/**
 * @swagger
 * /version:
 *   get:
 *     summary: Versión de la API
 *     tags: [Health]
 */
router.get("/version", healthController.getVersion);
router.get(
  "/health/operations",
  requireAdminDebugSecret,
  healthController.getLaunchOperations
);

export default router;
