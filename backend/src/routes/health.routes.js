import { Router } from "express";
import { requireAdminDebugSecret } from "../admin/admin.middleware.js";
import * as healthController from "../controllers/healthcontroller.js";

const router = Router();

router.get("/health", healthController.getHealth);
router.get("/version", healthController.getVersion);
router.get(
  "/health/operations",
  requireAdminDebugSecret,
  healthController.getLaunchOperations
);

export default router;
