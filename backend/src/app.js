import express from "express";
import cors from "cors";
import billingWebhookRouter from "./billing/webhook.routes.js";
import apiRoutes from "./routes/index.js";

/** Export CJS + import ESM: asegurar factory real (evita `listen` ausente). */
const createApplication =
  typeof express === "function" ? express : express?.default;
if (typeof createApplication !== "function") {
  throw new Error(
    "[MultaCheck] express no expone createApplication (revisá instalación de `express`)."
  );
}

const app = createApplication();

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

app.use(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  billingWebhookRouter
);

app.use(express.json());
app.use("/api", apiRoutes);

export default app;
