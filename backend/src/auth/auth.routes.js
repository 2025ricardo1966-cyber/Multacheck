import { Router } from "express";
import * as authController from "./auth.controller.js";

const router = Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);

export default router;
