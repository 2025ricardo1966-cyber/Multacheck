import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { computeGatewayFingerprint } from "../src/infra/securityGateway/requestFingerprint.js";
import { scanJsonBody } from "../src/infra/securityGateway/securityScanner.js";
import {
  recordSecurityViolations,
  isAdaptivelyBlocked,
  __resetAdaptiveBlockForTests,
} from "../src/infra/securityGateway/adaptiveBlock.js";
import { __resetSecurityGatewayForTests } from "../src/infra/securityGateway/securityGateway.middleware.js";

function minimalRules(overrides = {}) {
  return {
    maxJsonDepth: 8,
    maxStringLength: 1000,
    maxObjectKeysPerLevel: 50,
    stringPatterns: [
      {
        id: "xss_script_tag_open",
        pattern: /<\s*script\b/i,
      },
    ],
    routeAllowlistPrefixes: ["/multa"],
    ...overrides,
  };
}

describe("securityGateway", () => {
  beforeEach(() => {
    __resetSecurityGatewayForTests();
    __resetAdaptiveBlockForTests();
    delete process.env.MULTACHECK_SECURITY_GATEWAY;
    delete process.env.MULTACHECK_GATEWAY_ROUTE_ALLOWLIST;
    delete process.env.MULTACHECK_GATEWAY_ADAPTIVE_THRESHOLD;
    delete process.env.MULTACHECK_GATEWAY_ADAPTIVE_WINDOW_MS;
    delete process.env.MULTACHECK_GATEWAY_ADAPTIVE_BLOCK_MS;
  });

  it("fingerprint estable para misma petición", () => {
    const req = {
      method: "POST",
      path: "/multa/analyze",
      headers: {
        "content-type": "application/json",
        "user-agent": "test",
      },
    };
    const a = computeGatewayFingerprint(req, "1.2.3.4");
    const b = computeGatewayFingerprint(req, "1.2.3.4");
    assert.equal(a, b);
    assert.notEqual(a, computeGatewayFingerprint(req, "5.6.7.8"));
  });

  it("scanJsonBody detecta patrón registrado", () => {
    const flags = [];
    scanJsonBody(
      { description: "x <script>alert(1)</script>" },
      minimalRules(),
      flags
    );
    assert.ok(flags.some((f) => f.startsWith("pattern:")));
  });

  it("scanJsonBody detecta profundidad excesiva", () => {
    let o = { v: 1 };
    for (let i = 0; i < 30; i++) o = { nest: o };
    const flags = [];
    scanJsonBody(o, minimalRules({ maxJsonDepth: 5 }), flags);
    assert.ok(flags.includes("json_depth_exceeded"));
  });

  it("bloqueo adaptativo tras umbral de violaciones", () => {
    process.env.MULTACHECK_GATEWAY_ADAPTIVE_THRESHOLD = "2";
    process.env.MULTACHECK_GATEWAY_ADAPTIVE_WINDOW_MS = "60000";
    process.env.MULTACHECK_GATEWAY_ADAPTIVE_BLOCK_MS = "60000";
    assert.equal(isAdaptivelyBlocked("10.0.0.9"), false);
    recordSecurityViolations("10.0.0.9", 2);
    assert.equal(isAdaptivelyBlocked("10.0.0.9"), true);
  });

  it("middleware activo rechaza payload con firma XSS", async () => {
    process.env.MULTACHECK_SECURITY_GATEWAY = "1";
    const { createSecurityGatewayCoreMiddleware } = await import(
      "../src/infra/securityGateway/securityGateway.middleware.js"
    );
    const mw = createSecurityGatewayCoreMiddleware();
    const req = {
      method: "POST",
      path: "/multa/analyze",
      originalUrl: "/api/multa/analyze",
      headers: {},
      body: { description: "<script>", country: "AR", type: "transito" },
    };
    /** @type {Record<string, (() => void) | undefined>} */
    const ev = {};
    const res = {
      statusCode: 200,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(payload) {
        this.payload = payload;
      },
      getHeader() {
        return undefined;
      },
      on(name, fn) {
        if (name === "finish") ev.finish = fn;
      },
    };
    let nexted = false;
    await mw(req, res, () => {
      nexted = true;
    });
    assert.equal(nexted, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.payload?.error);
  });

  it("middleware desactivado delega next", async () => {
    delete process.env.MULTACHECK_SECURITY_GATEWAY;
    const { createSecurityGatewayCoreMiddleware } = await import(
      "../src/infra/securityGateway/securityGateway.middleware.js"
    );
    const mw = createSecurityGatewayCoreMiddleware();
    const req = {
      method: "POST",
      path: "/multa/analyze",
      originalUrl: "/api/multa/analyze",
      headers: {},
      body: { description: "<script>", country: "AR", type: "transito" },
    };
    const res = {
      statusCode: 200,
      on() {},
      getHeader() {
        return undefined;
      },
    };
    let nexted = false;
    await mw(req, res, () => {
      nexted = true;
    });
    assert.equal(nexted, true);
  });
});
