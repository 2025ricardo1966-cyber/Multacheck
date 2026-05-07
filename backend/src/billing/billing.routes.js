import { Router } from "express";
import * as billingController from "./billing.controller.js";

const router = Router();

router.post("/billing/checkout-session", billingController.createCheckoutSession);
router.post("/billing/portal-session", billingController.createPortalSession);

export default router;
