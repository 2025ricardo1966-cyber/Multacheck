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
