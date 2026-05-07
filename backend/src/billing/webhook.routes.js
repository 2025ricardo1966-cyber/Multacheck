import { Router } from "express";
import * as webhookController from "./webhook.controller.js";

const router = Router();

router.post("/", webhookController.handleStripeWebhook);

export default router;
