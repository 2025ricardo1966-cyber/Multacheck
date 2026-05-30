#!/usr/bin/env node
/**
 * Launch gate — API real (no contratos legacy del bash template).
 * Uso:
 *   node scripts/launch-gate.mjs
 *   MULTACHECK_API=https://x.onrender.com/api FRONTEND_URL=https://x.vercel.app node scripts/launch-gate.mjs
 */
const API =
  process.env.MULTACHECK_API?.replace(/\/$/, "") ||
  "https://multacheck-api.onrender.com/api";
const FRONTEND =
  process.env.FRONTEND_URL?.trim() || "https://multacheck.vercel.app";

const fails = [];
const warns = [];
let step = 0;

function pass(msg) {
  console.log(`✅ ${++step}. ${msg}`);
}
function fail(msg, detail = "") {
  console.log(`❌ ${++step}. ${msg} — DO NOT LAUNCH`);
  if (detail) console.log(`   ${detail}`);
  fails.push(msg);
}
function warn(msg) {
  console.log(`⚠️  ${++step}. ${msg}`);
  warns.push(msg);
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { res, json };
}

const ts = Date.now();
let savedEmail = `prelaunch-${ts}@example.com`;
let savedSlug = `prelaunch-${ts}`;
let savedToken = null;

console.log(`\n🚀 LAUNCH GATE\nAPI: ${API}\nFrontend: ${FRONTEND}\n`);

// 1. Health
try {
  const { res, json } = await api("/health");
  const ok =
    res.status === 200 &&
    (json.status === "healthy" || json.ok === true);
  if (ok) pass(`Health PASS (${json.status}, DB=${json.checks?.database})`);
  else
    fail(
      "Health FAIL",
      `HTTP ${res.status} status=${json.status ?? json.raw ?? "?"}`
    );
} catch (e) {
  fail("Health FAIL", e.message);
}

// 2. Register
try {
  const { res, json } = await api("/auth/register", {
    method: "POST",
    body: {
      email: savedEmail,
      password: "PreLaunch123!@",
      companyName: "Pre-Launch Test",
      companySlug: savedSlug,
    },
  });
  if (res.status === 201 && json.token) {
    savedToken = json.token;
    pass("Register PASS");
  } else fail("Register FAIL", `HTTP ${res.status} ${JSON.stringify(json)}`);
} catch (e) {
  fail("Register FAIL", e.message);
}

// 3. Login
try {
  const { res, json } = await api("/auth/login", {
    method: "POST",
    body: {
      email: savedEmail,
      password: "PreLaunch123!@",
      tenantSlug: savedSlug,
    },
  });
  if (res.status === 200 && json.token) {
    savedToken = json.token;
    pass("Login PASS");
  } else fail("Login FAIL", `HTTP ${res.status} ${JSON.stringify(json)}`);
} catch (e) {
  fail("Login FAIL", e.message);
}

// 4. Plans
try {
  const { res, json } = await api("/plans");
  const n = Array.isArray(json.data) ? json.data.length : 0;
  if (res.status === 200 && n > 0) pass(`Plans PASS (${n} plans)`);
  else fail("Plans FAIL", `HTTP ${res.status} count=${n}`);
} catch (e) {
  fail("Plans FAIL", e.message);
}

// 5. Analyze anónimo
try {
  const { res, json } = await api("/multa/analyze", {
    method: "POST",
    body: {
      country: "AR",
      type: "estacionamiento",
      description: "Prelaunch test estacionamiento",
    },
  });
  const tl = json.data?.trafficLight;
  if (res.status === 200 && ["GREEN", "YELLOW", "RED"].includes(tl)) {
    pass(`Analyze anónimo PASS (trafficLight: ${tl})`);
  } else
    fail(
      "Analyze anónimo FAIL",
      `HTTP ${res.status} trafficLight=${tl ?? "null"}`
    );
} catch (e) {
  fail("Analyze anónimo FAIL", e.message);
}

// 6. Checkout descargo (register → analyze → discharge-checkout)
try {
  const ts2 = Date.now();
  const email2 = `prelaunch-auth-${ts2}@example.com`;
  const slug2 = `prelaunch-auth-${ts2}`;
  const { res: regRes, json: regJson } = await api("/auth/register", {
    method: "POST",
    body: {
      email: email2,
      password: "PreLaunch123!@",
      companyName: "Pre-Launch Auth",
      companySlug: slug2,
    },
  });
  if (!regJson.token) throw new Error(`Register auth user: HTTP ${regRes.status}`);

  const { res: anRes, json: anJson } = await api("/multa/analyze", {
    method: "POST",
    token: regJson.token,
    body: {
      country: "AR",
      type: "transito",
      description: "Prelaunch multa con descargo",
    },
  });
  const multaId = anJson.data?.multaId;
  if (!multaId) throw new Error(`Analyze auth: HTTP ${anRes.status}`);

  const { res: coRes, json: coJson } = await api(
    `/multa/${multaId}/discharge-checkout`,
    { method: "POST", token: regJson.token, body: {} }
  );
  const url = coJson.url;
  if (
    coRes.status === 200 &&
    typeof url === "string" &&
    url.startsWith("https://checkout.stripe.com")
  ) {
    pass("Discharge checkout PASS (Stripe URL valid)");
  } else {
    fail(
      "Discharge checkout FAIL",
      `HTTP ${coRes.status} url=${url ?? "null"} — check APP_MODE=production + STRIPE_SECRET_KEY`
    );
  }
} catch (e) {
  fail("Discharge checkout FAIL", e.message);
}

// 7. Frontend
try {
  const res = await fetch(FRONTEND, { method: "HEAD", redirect: "follow" });
  if (res.status === 200) pass("Frontend PASS (HTTP 200)");
  else fail("Frontend FAIL", `HTTP ${res.status}`);
} catch (e) {
  fail("Frontend FAIL", e.message);
}

// 8. Sentry (local .env check)
try {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const env = await fs.readFile(path.join(root, ".env"), "utf8");
  const m = env.match(/^SENTRY_DSN=(.+)$/m);
  if (m?.[1]?.trim() && !m[1].includes("YOUR_")) {
    pass("Sentry configured (local .env)");
  } else {
    warn("Sentry NOT configured (set SENTRY_DSN in Render + .env)");
  }
} catch {
  warn("Sentry check skipped (.env unreadable)");
}

// 9. Logs
warn(
  "Logs: pino → stdout en Render (no backend/logs/ en prod); OK si Sentry activo"
);

// 10. Git clean
try {
  const { execSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const repoRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
  );
  const porcelain = execSync("git status --porcelain", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (porcelain) {
    fail("Uncommitted changes — COMMIT before launch");
    console.log(porcelain.split("\n").slice(0, 15).join("\n"));
  } else pass("All changes committed");
} catch (e) {
  warn(`Git check failed: ${e.message}`);
}

console.log("\n========================================");
if (fails.length === 0) {
  console.log("✅ ALL REQUIRED CHECKS PASSED — READY TO LAUNCH");
} else {
  console.log("🚫 DO NOT LAUNCH — FAILED CHECKS:");
  fails.forEach((f) => console.log(`   • ${f}`));
}
if (warns.length) {
  console.log("\nWarnings:");
  warns.forEach((w) => console.log(`   • ${w}`));
}
console.log("========================================\n");

process.exit(fails.length > 0 ? 1 : 0);
