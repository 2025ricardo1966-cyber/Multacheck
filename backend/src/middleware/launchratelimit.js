import { isStrictLaunchRateLimits } from "../config/launchflags.js";

function clientIp(req) {
  const xf = req.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.ip ?? "unknown";
}

function makeSlidingLimiter({ windowMs, max, keyFn }) {
  const buckets = new Map();
  return function rateLimitMiddleware(req, res, next) {
    const key = keyFn(req);
    const now = Date.now();
    let arr = buckets.get(key);
    if (!arr) {
      arr = [];
      buckets.set(key, arr);
    }
    while (arr.length && now - arr[0] > windowMs) {
      arr.shift();
    }
    if (arr.length >= max) {
      return res.status(429).json({
        error: "Too many requests. Try again shortly.",
        code: "RATE_LIMIT",
      });
    }
    arr.push(now);
    next();
  };
}

let _analyzeLimiter = null;
let _checkoutLimiter = null;

export function analyzeRateLimit(req, res, next) {
  if (!_analyzeLimiter) {
    const strict = isStrictLaunchRateLimits();
    _analyzeLimiter = makeSlidingLimiter({
      windowMs: 60_000,
      max: strict ? 5 : 20,
      keyFn: (r) =>
        `analyze:${r.tenant?.id ?? "na"}:${r.user?.id ?? clientIp(r)}`,
    });
  }
  return _analyzeLimiter(req, res, next);
}

export function checkoutRateLimit(req, res, next) {
  if (!_checkoutLimiter) {
    const strict = isStrictLaunchRateLimits();
    _checkoutLimiter = makeSlidingLimiter({
      windowMs: 60_000,
      max: strict ? 3 : 12,
      keyFn: (r) =>
        `checkout:${r.tenant?.id ?? "na"}:${r.user?.id ?? clientIp(r)}:${r.params?.multaId ?? "na"}`,
    });
  }
  return _checkoutLimiter(req, res, next);
}
