#!/usr/bin/env node
/**
 * Verifica que el webhook Stripe esté montado y que /api/health exponga metadata.
 * No firma eventos reales; usa POST sin Stripe-Signature para validar la ruta.
 *
 * Requiere API en marcha: npm start
 *
 * Uso:
 *   npm run verify:webhook
 *   API_URL=http://127.0.0.1:3000 npm run verify:webhook
 */
const RAW_BASE =
  process.env.API_URL?.trim() ||
  process.env.CRITICAL_TEST_API?.trim() ||
  "http://127.0.0.1:3000";
const BASE = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/, "");

const HEALTH = `${BASE}/api/health`;
const WEBHOOK = `${BASE}/api/billing/webhook`;

async function main() {
  console.log("MultaCheck — verify Stripe webhook route\n");

  console.log("→ GET", HEALTH);
  let hr;
  try {
    hr = await fetch(HEALTH);
  } catch (e) {
    console.error(
      "❌ No se pudo conectar al API. ¿Tenés `npm start` en marcha?",
      e.message || e
    );
    process.exitCode = 1;
    return;
  }
  const hj = await hr.json().catch(() => ({}));
  console.log("  HTTP", hr.status, "| status:", hj.status);
  const sw = hj.stripeWebhook;
  if (!sw?.path) {
    console.error("❌ /api/health no incluye stripeWebhook.path");
    process.exitCode = 1;
    return;
  }
  console.log("  stripeWebhook:", JSON.stringify(sw, null, 2));

  console.log("\n→ POST", WEBHOOK, "(Content-Type: application/json, sin Stripe-Signature)");
  const wr = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const wt = await wr.text();
  console.log("  HTTP", wr.status, "| body:", wt.slice(0, 160));

  if (wr.status === 400 && /Stripe-Signature|signature/i.test(wt)) {
    console.log("\n✅ Ruta montada: rechazo esperado sin cabecera Stripe-Signature.");
  } else if (wr.status === 503 && /configurado|Billing/i.test(wt)) {
    console.log(
      "\n⚠️ Ruta montada pero billing no configurado (STRIPE_*). Configurá claves y repetí."
    );
  } else if (wr.status === 404) {
    console.error("\n❌ 404 — la ruta no está montada en este servidor.");
    process.exitCode = 1;
  } else {
    console.log("\n⚠️ Respuesta no estándar; revisá logs del proceso Node.");
  }

  console.log("\n--- Firma real (Stripe CLI) ---");
  console.log(`stripe listen --forward-to ${BASE}/api/billing/webhook`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
