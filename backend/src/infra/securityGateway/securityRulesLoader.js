import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('./securityScanner.js').GatewayRules | null} */
let cached = null;

/** @internal tests */
export function __resetGatewayRulesCacheForTests() {
  cached = null;
}

/**
 * Carga config/security-gateway-rules.json (relativo al cwd del proceso, típicamente backend/).
 */
export async function loadGatewaySecurityRules() {
  if (cached) return cached;

  const candidates = [
    path.join(process.cwd(), "config", "security-gateway-rules.json"),
    path.join(__dirname, "../../../config/security-gateway-rules.json"),
  ];

  let text = null;
  for (const p of candidates) {
    try {
      text = await fs.readFile(p, "utf8");
      break;
    } catch {
      /* siguiente */
    }
  }

  if (!text) {
    cached = getDefaultRules();
    return cached;
  }

  try {
    const parsed = JSON.parse(text);
    cached = normalizeRules(parsed);
    return cached;
  } catch {
    cached = getDefaultRules();
    return cached;
  }
}

/** Sync helper para middleware (primera request puede usar defaults hasta refresh opcional). */
export function getCachedGatewayRulesSync() {
  return cached ?? getDefaultRules();
}

/** @param {unknown} parsed */
function normalizeRules(parsed) {
  const maxJsonDepth =
    typeof parsed?.maxJsonDepth === "number" && parsed.maxJsonDepth >= 4
      ? Math.min(Math.floor(parsed.maxJsonDepth), 64)
      : 24;
  const maxStringLength =
    typeof parsed?.maxStringLength === "number" && parsed.maxStringLength >= 1024
      ? Math.min(Math.floor(parsed.maxStringLength), 2_000_000)
      : 120_000;
  const maxObjectKeysPerLevel =
    typeof parsed?.maxObjectKeysPerLevel === "number" &&
    parsed.maxObjectKeysPerLevel >= 8
      ? Math.min(Math.floor(parsed.maxObjectKeysPerLevel), 2000)
      : 200;

  /** @type {{ id: string, pattern: RegExp }[]} */
  const stringPatterns = [];
  if (Array.isArray(parsed?.stringPatterns)) {
    for (const row of parsed.stringPatterns) {
      if (!row?.id || typeof row.pattern !== "string") continue;
      try {
        stringPatterns.push({
          id: String(row.id),
          pattern: new RegExp(row.pattern),
        });
      } catch {
        /* patrón inválido omitido */
      }
    }
  }

  const routeAllowlistPrefixes = Array.isArray(parsed?.routeAllowlistPrefixes)
    ? parsed.routeAllowlistPrefixes.map((x) => String(x))
    : getDefaultRules().routeAllowlistPrefixes;

  return {
    maxJsonDepth,
    maxStringLength,
    maxObjectKeysPerLevel,
    stringPatterns,
    routeAllowlistPrefixes,
  };
}

function getDefaultRules() {
  return normalizeRules({
    maxJsonDepth: 24,
    maxStringLength: 120_000,
    maxObjectKeysPerLevel: 200,
    stringPatterns: [],
    routeAllowlistPrefixes: [
      "/health",
      "/version",
      "/admin",
      "/auth",
      "/multa",
      "/billing",
    ],
  });
}
