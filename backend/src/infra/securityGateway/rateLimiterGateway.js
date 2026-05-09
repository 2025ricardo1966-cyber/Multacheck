import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { clientIp } from "../../middleware/clientIp.js";
import { appendGatewayAudit } from "./gatewayAudit.js";
import { isGatewayAuditEnabled } from "./config.js";
import { computeGatewayFingerprint } from "./requestFingerprint.js";

function parsePositiveInt(name, fallback) {
  const n = Number(process.env[name]);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

/** Claves opcionales para cuotas distintas por API key (infra). */
function gatewayApiKeyBucket(req) {
  const keysEnv = process.env.MULTACHECK_GATEWAY_API_KEYS?.trim();
  if (!keysEnv) return null;
  const allowed = new Set(
    keysEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const raw = req.headers?.["x-multacheck-gateway-key"];
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (!key || !allowed.has(key)) return null;
  const hash = crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `key:${hash}`;
}

export function gatewayRateLimitSkip(req) {
  if (req.method === "OPTIONS") return true;
  const p = req.path ?? "";
  return p === "/health" || p === "/version";
}

function gatewayRateLimitHandler(tier) {
  return (req, res, next, options) => {
    const ip = clientIp(req);
    if (isGatewayAuditEnabled()) {
      void appendGatewayAudit({
        at: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl ?? req.url ?? "",
        apiPath: req.path ?? "",
        ip,
        fingerprint: computeGatewayFingerprint(req, ip),
        routingDecision: "blocked_rate_limit",
        rateLimitTier: tier,
        securityFlags: [],
        gatewayStages: ["rate_limit"],
        statusCode: options.statusCode ?? 429,
      });
    }
    const msg = options.message;
    const body =
      typeof msg === "object" && msg !== null && !Array.isArray(msg)
        ? msg
        : { error: String(msg ?? "Too many requests") };
    res.status(options.statusCode ?? 429).json(body);
  };
}

export function createGatewayBurstLimiter() {
  const windowMs = parsePositiveInt(
    "MULTACHECK_GATEWAY_BURST_WINDOW_MS",
    60_000
  );
  const ipMax = parsePositiveInt("MULTACHECK_GATEWAY_BURST_MAX", 80);
  const keyMax = parsePositiveInt("MULTACHECK_GATEWAY_KEY_BURST_MAX", 400);

  return rateLimit({
    windowMs,
    max: (req) => (gatewayApiKeyBucket(req) ? keyMax : ipMax),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const kb = gatewayApiKeyBucket(req);
      return kb ? `gw:burst:${kb}` : `gw:burst:${clientIp(req)}`;
    },
    skip: gatewayRateLimitSkip,
    message: {
      success: false,
      error:
        "Demasiadas solicitudes en poco tiempo. Probá de nuevo en unos segundos.",
    },
    handler: gatewayRateLimitHandler("burst"),
  });
}

export function createGatewaySustainedLimiter() {
  const windowMs = parsePositiveInt(
    "MULTACHECK_GATEWAY_SUSTAINED_WINDOW_MS",
    15 * 60 * 1000
  );
  const ipMax = parsePositiveInt("MULTACHECK_GATEWAY_SUSTAINED_MAX", 2000);
  const keyMax = parsePositiveInt("MULTACHECK_GATEWAY_KEY_SUSTAINED_MAX", 12000);

  return rateLimit({
    windowMs,
    max: (req) => (gatewayApiKeyBucket(req) ? keyMax : ipMax),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const kb = gatewayApiKeyBucket(req);
      return kb ? `gw:sust:${kb}` : `gw:sust:${clientIp(req)}`;
    },
    skip: gatewayRateLimitSkip,
    message: {
      success: false,
      error:
        "Límite de solicitudes alcanzado para esta ventana. Intentá más tarde.",
    },
    handler: gatewayRateLimitHandler("sustained"),
  });
}
