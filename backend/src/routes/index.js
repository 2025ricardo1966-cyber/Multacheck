import { Router } from "express";
import adminRoutes from "../admin/admin.routes.js";
import authRoutes from "../auth/auth.routes.js";
import * as authController from "../auth/auth.controller.js";
import { authenticateJWT, optionalAuthenticateJWT } from "../auth/jwt.middleware.js";
import {
  attachTenantContext,
  attachTenantContextIfAuthenticated,
} from "../core/tenant.context.js";
import multaRoutes from "../multas/multa.routes.js";
import { analyze } from "../multas/multa.controller.js";
import { analyzeLimiter, authLimiter } from "../middleware/rateLimits.js";
import { enforceAuthenticatedAnalyzeQuota } from "../usage/usage.middleware.js";
import billingRoutes from "../billing/billing.routes.js";
import planRoutes from "../plans/plan.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/plans", planRoutes);
router.use("/admin", adminRoutes);

router.use("/auth/login", authLimiter);
router.use("/auth/register", authLimiter);
router.use(authRoutes);

/**
 * @swagger
 * /multa/analyze:
 *   post:
 *     summary: Analiza una multa de tránsito
 *     tags: [Multas]
 *     description: JWT opcional; sin token devuelve vista previa anónima.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country:
 *                 type: string
 *                 example: AR
 *               type:
 *                 type: string
 *                 example: exceso_velocidad
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Análisis completado
 */
// analyzeLimiter va después del JWT opcional para poder limitar por usuario.
router.post(
  "/multa/analyze",
  optionalAuthenticateJWT,
  attachTenantContextIfAuthenticated,
  enforceAuthenticatedAnalyzeQuota,
  analyzeLimiter,
  analyze
);

const protectedRouter = Router();
protectedRouter.use(authenticateJWT);
protectedRouter.use(attachTenantContext);
protectedRouter.get("/auth/me", authController.me);
protectedRouter.post("/auth/logout", authController.logout);
protectedRouter.use(billingRoutes);
protectedRouter.use(multaRoutes);

router.use(protectedRouter);

export default router;
