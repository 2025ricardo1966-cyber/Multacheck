import { Router } from "express";
import {
  analyze,
  createDischargeCheckout,
  getPaymentStatus,
  getMultaState,
  getMultaFullState,
  getDischarge,
} from "./multa.controller.js";
import {
  analyzeRateLimit,
  checkoutRateLimit,
} from "../middleware/launchratelimit.js";

const router = Router();

router.post("/multa/analyze", analyzeRateLimit, analyze);
router.post(
  "/multa/:multaId/discharge-checkout",
  checkoutRateLimit,
  createDischargeCheckout
);
router.get("/multa/:multaId/payment-status", getPaymentStatus);
router.get("/multa/:multaId/state", getMultaState);
router.get(
  "/multa/:multaId/full-state",
  getMultaFullState
);
router.get("/multa/:multaId/discharge", getDischarge);

export default router;
