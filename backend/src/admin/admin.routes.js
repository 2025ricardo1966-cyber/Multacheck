import { Router } from "express";
import { requireAdminDebugSecret } from "./admin.middleware.js";
import * as adminMultaController from "./admin.multa.controller.js";

const router = Router();

router.use(requireAdminDebugSecret);
router.get("/multa/:multaId/debug", adminMultaController.getMultaDebug);

export default router;
