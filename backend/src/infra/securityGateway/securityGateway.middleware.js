/**
 * API Gateway + Security Edge (opcional).
 *
 * Pipeline lógico cuando MULTACHECK_SECURITY_GATEWAY=1 en rutas bajo /api:
 *
 *   rate_burst → rate_sustained → normalize_headers → fingerprint
 *     → route_allowlist (opcional) → json_security_scan → routing_allowed
 *
 * No envuelve scoring ni servicios de dominio; solo middleware Express.
 */

import { clientIp } from "../../middleware/clientIp.js";
import {
  isSecurityGatewayEnabled,
  isGatewayAuditEnabled,
  isGatewayRouteAllowlistEnabled,
} from "./config.js";
import {
  loadGatewaySecurityRules,
  __resetGatewayRulesCacheForTests,
} from "./securityRulesLoader.js";
import { attachNormalizedGatewayHeaders } from "./normalizeGatewayHeaders.js";
import { computeGatewayFingerprint } from "./requestFingerprint.js";
import { scanJsonBody } from "./securityScanner.js";
import {
  isAdaptivelyBlocked,
  recordSecurityViolations,
  __resetAdaptiveBlockForTests,
} from "./adaptiveBlock.js";
import { appendGatewayAudit } from "./gatewayAudit.js";
import { telemetryEmit } from "../telemetry/telemetryEmit.js";

/** Primera carga async de reglas desde disco. */
let rulesLoadPromise = null;

/** @internal tests */
export function __resetSecurityGatewayMiddlewareForTests() {
  rulesLoadPromise = null;
}

function ensureRulesLoaded() {
  if (!rulesLoadPromise) rulesLoadPromise = loadGatewaySecurityRules();
  return rulesLoadPromise;
}

function routeMatchesAllowlist(path, prefixes) {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function summarizeRateLimit(req, res) {
  const remain = res.getHeader("RateLimit-Remaining");
  const reset = res.getHeader("RateLimit-Reset");
  if (remain != null || reset != null) {
    return {
      remaining:
        typeof remain === "string" || typeof remain === "number"
          ? remain
          : undefined,
      reset:
        typeof reset === "string" || typeof reset === "number"
          ? reset
          : undefined,
    };
  }
  return undefined;
}

/**
 * Middleware async: fingerprint, allowlist opcional, escaneo JSON.
 */
export function createSecurityGatewayCoreMiddleware() {
  return async function securityGatewayCore(req, res, next) {
    if (!isSecurityGatewayEnabled()) {
      next();
      return;
    }

    if (req.method === "OPTIONS") {
      next();
      return;
    }

    const ip = clientIp(req);

    if (isAdaptivelyBlocked(ip)) {
      const fp = computeGatewayFingerprint(req, ip);
      res.status(403);
      await maybeAudit(req, res, {
        ip,
        fingerprint: fp,
        routingDecision: "blocked_adaptive",
        rateLimit: summarizeRateLimit(req, res),
        securityFlags: [],
        gatewayStages: ["adaptive_block_hit"],
      });
      res.json({
        error:
          "Acceso temporalmente restringido por actividad sospechosa repetida.",
      });
      return;
    }

    const rules = await ensureRulesLoaded();

    req.gateway = {
      stages: [],
      securityFlags: [],
      fingerprint: "",
      normalizedHeaders: attachNormalizedGatewayHeaders(req),
    };

    req.gateway.stages.push("headers_normalized");

    const fingerprint = computeGatewayFingerprint(req, ip);
    req.gateway.fingerprint = fingerprint;

    if (isGatewayRouteAllowlistEnabled()) {
      const path = req.path ?? "";
      if (!routeMatchesAllowlist(path, rules.routeAllowlistPrefixes)) {
        req.gateway.stages.push("route_allowlist_reject");
        recordSecurityViolations(ip, 2);
        res.status(404);
        await maybeAudit(req, res, {
          ip,
          fingerprint,
          routingDecision: "blocked_allowlist",
          rateLimit: summarizeRateLimit(req, res),
          securityFlags: ["route_not_allowlisted"],
          gatewayStages: [...req.gateway.stages],
        });
        res.json({ error: "Not found" });
        return;
      }
      req.gateway.stages.push("route_allowlist_ok");
    } else {
      req.gateway.stages.push("route_allowlist_disabled");
    }

    const method = req.method ?? "GET";
    const shouldScanBody =
      (method === "POST" || method === "PUT" || method === "PATCH") &&
      req.body != null &&
      typeof req.body === "object";

    if (shouldScanBody) {
      /** @type {string[]} */
      const flags = [];
      try {
        scanJsonBody(req.body, rules, flags);
      } catch {
        flags.push("scan_threw");
      }

      req.gateway.securityFlags.push(...flags);

      if (flags.length > 0) {
        req.gateway.stages.push("security_scan_reject");
        recordSecurityViolations(ip, flags.length);
        res.status(400);
        await maybeAudit(req, res, {
          ip,
          fingerprint,
          routingDecision: "blocked_security",
          rateLimit: summarizeRateLimit(req, res),
          securityFlags: flags,
          gatewayStages: [...req.gateway.stages],
        });
        res.json({
          error: "Solicitud rechazada por política de seguridad.",
        });
        return;
      }
      req.gateway.stages.push("security_scan_ok");
    } else {
      req.gateway.stages.push("security_scan_skipped");
    }

    req.gateway.stages.push("routing_allowed");

    telemetryEmit({
      module_source: "security.gateway",
      event_type: "gateway.request.passed",
      payload: {
        stage_count: req.gateway.stages.length,
        security_flag_count: req.gateway.securityFlags.length,
      },
    });

    res.on("finish", () => {
      void maybeAudit(req, res, {
        ip,
        fingerprint,
        routingDecision: "allowed",
        rateLimit: summarizeRateLimit(req, res),
        securityFlags: [...req.gateway.securityFlags],
        gatewayStages: [...req.gateway.stages],
      });
    });

    next();
  };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {object} extra
 */
async function maybeAudit(req, res, extra = {}) {
  if (!isGatewayAuditEnabled()) return;

  const { statusCode: explicitStatus, ...auditRest } = extra;

  await appendGatewayAudit({
    at: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl ?? req.url ?? "",
    apiPath: req.path ?? "",
    ...auditRest,
    statusCode:
      typeof explicitStatus === "number" ? explicitStatus : res.statusCode,
  });
}

export function __resetSecurityGatewayForTests() {
  __resetSecurityGatewayMiddlewareForTests();
  __resetGatewayRulesCacheForTests();
  __resetAdaptiveBlockForTests();
}
