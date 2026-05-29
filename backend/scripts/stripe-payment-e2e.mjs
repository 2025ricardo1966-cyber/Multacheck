#!/usr/bin/env node
/**
 * E2E Stripe (informe de descargo): register → login → analyze → discharge-checkout.
 * El pago en browser + webhook requiere `stripe listen` en otra terminal.
 *
 * Uso:
 *   npm run test:stripe-e2e
 *   npm run test:stripe-e2e -- --wait    # tras pagar, poll hasta DISCHARGE_READY
 */
import { resolveOfficialApiBase } from "./official-api-base.mjs";

const BASE = resolveOfficialApiBase();
const WAIT_AFTER_PAY = process.argv.includes("--wait");
const POLL_MS = 3000;
const POLL_MAX = 40;

const stamp = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
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
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=== Stripe payment E2E (API real) ===\n");
  console.log(`API: ${BASE}\n`);

  const health = await api("/health");
  console.log("✅ Health:", health.status ?? health.checks?.server);
  console.log("   Stripe:", health.checks?.stripe);
  console.log("   Webhook readiness:", health.stripeWebhook?.readiness);

  if (health.checks?.stripe !== "configured") {
    console.error("\n❌ STRIPE_SECRET_KEY no configurado en el servidor.");
    process.exit(1);
  }

  const email = process.env.STRIPE_E2E_EMAIL || `stripe_e2e_${stamp()}@test.com`;
  const password = process.env.STRIPE_E2E_PASSWORD || "Test1234!";
  const slug = process.env.STRIPE_E2E_SLUG || `stripe-e2e-${stamp()}`;

  console.log("\n--- Register ---");
  const reg = await api("/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      companyName: "Stripe E2E Co",
      companySlug: slug,
    },
  });
  let token = reg.token;
  console.log("✅ Register OK", reg.user?.email, "tenantSlug:", reg.user?.tenantSlug);

  console.log("\n--- Login ---");
  const login = await api("/auth/login", {
    method: "POST",
    body: { email, password, tenantSlug: reg.user?.tenantSlug ?? slug },
  });
  token = login.token;
  console.log("✅ Login OK");

  console.log("\n--- Analyze ---");
  const analyze = await api("/multa/analyze", {
    method: "POST",
    token,
    body: {
      country: "AR",
      type: "transito",
      description: `E2E estacionamiento indebido ${stamp()}`,
    },
  });
  const multaId = analyze.data?.multaId;
  if (!multaId) {
    console.error("❌ Sin multaId en analyze:", analyze);
    process.exit(1);
  }
  console.log("✅ Analyze OK", {
    multaId,
    trafficLight: analyze.data?.trafficLight,
    caseState: analyze.data?.caseState,
  });

  console.log("\n--- Discharge checkout ---");
  let checkout;
  try {
    checkout = await api(`/multa/${multaId}/discharge-checkout`, {
      method: "POST",
      token,
      body: {},
    });
  } catch (e) {
    if (e.status === 503 && String(e.message).includes("Checkout no disponible")) {
      console.error("\n❌ Checkout deshabilitado. Poné APP_MODE=production en backend/.env y reiniciá.");
    }
    throw e;
  }

  const payUrl = checkout.url;
  if (!payUrl) {
    console.error("❌ Sin checkout.url:", checkout);
    process.exit(1);
  }

  console.log("✅ Checkout session:", checkout.sessionId);
  console.log("\n🔗 Abrí esta URL y pagá con 4242 4242 4242 4242:");
  console.log(payUrl);
  console.log("\nEn otra terminal debe estar:");
  console.log("  stripe listen --forward-to localhost:3000/api/billing/webhook\n");

  if (!WAIT_AFTER_PAY) {
    console.log("Cuando termines el pago, verificá con:");
    console.log(`  curl -H "Authorization: Bearer $TOKEN" ${BASE}/multa/${multaId}/state`);
    console.log("\nO re-ejecutá: npm run test:stripe-e2e -- --wait");
    return;
  }

  console.log("--- Esperando DISCHARGE_READY (poll) ---");
  for (let i = 0; i < POLL_MAX; i++) {
    await sleep(POLL_MS);
    const state = await api(`/multa/${multaId}/state`, { token });
    const cs = state.caseState;
    console.log(`   [${i + 1}/${POLL_MAX}] caseState=${cs}`);
    if (cs === "DISCHARGE_READY" || cs === "DISCHARGED") {
      const discharge = await api(`/multa/${multaId}/discharge`, { token });
      const len = discharge.dischargeBody?.length ?? 0;
      console.log(`\n✅ Informe listo (${len} chars)`);
      if (len > 0) {
        console.log(discharge.dischargeBody.slice(0, 400) + (len > 400 ? "…" : ""));
      }
      return;
    }
  }

  console.error("\n❌ Timeout esperando descargo. Revisá stripe listen y APP_MODE=production.");
  process.exit(1);
}

main().catch((e) => {
  console.error("\n❌", e.message || e);
  process.exit(1);
});
