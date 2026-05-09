import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import { requireAdminDebugSecret } from "./admin.middleware.js";
import * as adminMultaController from "./admin.multa.controller.js";
import { costTracker } from "../ai/costTracker.js";
import prisma from "../db/prisma.js";
import BusinessMetrics from "../analytics/businessMetrics.js";
import { analysisCache } from "../infra/redisCache.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** HTML de monitorización (sin token); las APIs de datos siguen protegidas. */
router.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

router.use(requireAdminDebugSecret);

/**
 * @swagger
 * /admin/multa/{multaId}/debug:
 *   get:
 *     summary: Debug de multa (interno)
 *     tags: [Admin]
 *     security:
 *       - adminDebugToken: []
 */
router.get("/multa/:multaId/debug", adminMultaController.getMultaDebug);

/**
 * @swagger
 * /admin/ai-costs:
 *   get:
 *     summary: Costes IA acumulados (runtime)
 *     tags: [Admin]
 *     security:
 *       - adminDebugToken: []
 */
router.get("/ai-costs", (_req, res) => {
  res.json(costTracker.getStats());
});

/**
 * @swagger
 * /admin/metrics:
 *   get:
 *     summary: KPIs de negocio
 *     tags: [Admin]
 *     security:
 *       - adminDebugToken: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 */
router.get("/metrics", async (req, res, next) => {
  try {
    const metrics = new BusinessMetrics(prisma);
    const endDate = new Date();
    const startDate = new Date();
    const daysRaw = Number(req.query?.days ?? 30);
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 30;
    startDate.setDate(startDate.getDate() - days);
    const data = await metrics.getDashboard(startDate, endDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /admin/cache-stats:
 *   get:
 *     summary: Estadísticas Redis cache de análisis
 *     tags: [Admin]
 *     security:
 *       - adminDebugToken: []
 */
router.get("/cache-stats", async (_req, res, next) => {
  try {
    res.json(await analysisCache.getStats());
  } catch (err) {
    next(err);
  }
});

export default router;
