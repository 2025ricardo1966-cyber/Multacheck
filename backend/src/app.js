/**
 * Arranque mínimo estable (express + cors + JSON + API).
 * Para recuperar helmet, Swagger, webhooks Stripe, Sentry, rate limits y sanitización,
 * revisá el historial git (p. ej. commit anterior a este baseline).
 */
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";

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

app.use(express.json({ limit: "1mb" }));

app.use("/api", apiRoutes);

export default app;
