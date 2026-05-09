import express from "express";
import cors from "cors";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import mongoSanitizePkg from "express-mongo-sanitize";
// import billingWebhookRouter from "./billing/webhook.routes.js";
import apiRoutes from "./routes/index.js";
// import { initSentry, sentryErrorHandler } from "./config/sentry.js";
// import { webhookLimiter } from "./middleware/rateLimits.js";
// import { setupSwagger } from "./config/swagger.js";

/** Export CJS + import ESM: asegurar factory real (evita `listen` ausente). */
const createApplication =
  typeof express === "function" ? express : express?.default;
if (typeof createApplication !== "function") {
  throw new Error(
    "[MultaCheck] express no expone createApplication (revisá instalación de `express`)."
  );
}

const app = createApplication();

// initSentry(app);

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'", "'unsafe-inline'"],
//         imgSrc: ["'self'", "data:", "https:"],
//       },
//     },
//     hsts: {
//       maxAge: 31536000,
//       includeSubDomains: true,
//       preload: true,
//     },
//   })
// );

const frontendOrigin = process.env.FRONTEND_URL?.trim();

app.use(
  cors({
    origin: frontendOrigin || false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Stripe-Signature",
      "Idempotency-Key",
      "X-Admin-Debug-Token",
    ],
  })
);

// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: "Too many requests from this IP",
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) =>
//     typeof req.originalUrl === "string" &&
//     req.originalUrl.startsWith("/api/billing/webhook"),
// });
// app.use("/api", globalLimiter);

// app.use(
//   "/api/billing/webhook",
//   webhookLimiter,
//   express.raw({ type: "application/json" }),
//   billingWebhookRouter
// );

app.use(express.json({ limit: "1mb" }));

// app.use((req, _res, next) => {
//   if (req.body != null && typeof req.body === "object") {
//     try {
//       req.body = mongoSanitizePkg.sanitize(req.body);
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// setupSwagger(app);

app.use("/api", apiRoutes);

// sentryErrorHandler(app);

export default app;
