import rateLimit from "express-rate-limit";
import { clientIp } from "./clientIp.js";

// Análisis: 10 por hora por usuario autenticado; si no hay JWT, por IP.
export const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Demasiados análisis. Espera 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req /* , res */) => {
    const uid = req.auth?.userId;
    return uid ? `analyze:user:${uid}` : `analyze:ip:${clientIp(req)}`;
  },
});

// Auth: 5 intentos por 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Demasiados intentos. Espera 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhooks: 100 por minuto
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
