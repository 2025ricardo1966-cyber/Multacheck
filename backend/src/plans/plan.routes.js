import { Router } from "express";
import * as planController from "./plan.controller.js";

const router = Router();

router.get("/", planController.listPlans);

export default router;
