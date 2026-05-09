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
import healthRoutes from "./health.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/admin", adminRoutes);

router.use("/auth/login", authLimiter);
router.use("/auth/register", authLimiter);
router.use(authRoutes);

// analyzeLimiter va después del JWT opcional para poder limitar por usuario.
router.post(
  "/multa/analyze",
  optionalAuthenticateJWT,
  attachTenantContextIfAuthenticated,
  analyzeLimiter,
  analyze
);

const protectedRouter = Router();
protectedRouter.use(authenticateJWT);
protectedRouter.use(attachTenantContext);
protectedRouter.get("/auth/me", authController.me);
protectedRouter.post("/auth/logout", authController.logout);
protectedRouter.use(multaRoutes);

router.use(protectedRouter);

export default router;
