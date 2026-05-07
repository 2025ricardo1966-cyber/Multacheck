import { Router } from "express";
import * as analyticsController from "./analytics.controller.js";

const router = Router();

router.get("/analytics/overview", analyticsController.overview);
router.get("/analytics/tenant", analyticsController.tenant);
router.get("/analytics/usage", analyticsController.usage);

export default router;
