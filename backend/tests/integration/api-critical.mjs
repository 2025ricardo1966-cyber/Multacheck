/**
 * Tests de API en vivo (health → register → analyze [→ checkout si Stripe]).
 * Requiere servidor + DB. No se ejecutan con `npm run test:critical` (unitarios).
 *
 * Uso: npm run test:integration
 * API: CRITICAL_TEST_API | http://localhost:3000/api
 */
import assert from "node:assert/strict";

const API = process.env.CRITICAL_TEST_API?.trim() || "http://localhost:3000/api";

if (typeof globalThis.fetch !== "function") {
  console.error("❌ Se requiere Node.js 18+ (fetch global)");
  process.exit(1);
}

let token = "";
let multaId = "";

console.log("🧪 TESTS CRÍTICOS MULTACHECK (integración API)\n");

function isConnRefused(err) {
  return err?.code === "ECONNREFUSED" || err?.cause?.code === "ECONNREFUSED";
}

let health;
try {
  health = await fetch(`${API}/health`);
} catch (err) {
  assert.fail(
    isConnRefused(err)
      ? `❌ Sin servidor en ${API}. Levantá la API antes de npm run test:integration.`
      : String(err)
  );
}
assert(
  health.status === 200 || health.status === 503,
  `❌ Health endpoint sin respuesta (${health.status})`
);
const healthJson = await health.json();
assert.equal(healthJson.checks?.server, "ok", "❌ Health: checks.server");
if (health.status === 503) {
  console.log("⚠️ Health degraded:", healthJson.checks);
}
console.log("✅ Servidor vivo");

const register = await fetch(`${API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: `test${Date.now()}@test.com`,
    password: "Test1234!",
    companyName: "Test Company",
  }),
});
const regData = await register.json();
assert(register.ok && regData.token, `❌ Registro falla: ${JSON.stringify(regData)}`);
token = regData.token;
console.log("✅ Registro funciona");

const analyze = await fetch(`${API}/multa/analyze`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    country: "AR",
    type: "exceso_velocidad",
    description: "Test",
    amount: 50000,
  }),
});
const multa = await analyze.json();
assert(
  analyze.ok && multa.success && multa.data?.multaId,
  `❌ Análisis falla: ${JSON.stringify(multa)}`
);
multaId = multa.data.multaId;
console.log("✅ Análisis funciona");

const stripeReady = healthJson.checks?.stripe === "configured";
if (!stripeReady) {
  console.log(
    "⚠️ Omitiendo checkout Stripe (`checks.stripe` ≠ configured en /health)."
  );
  console.log("\n🎉 Tests de integración pasaron (core OK; Stripe no configurado)\n");
  process.exit(0);
}

const checkout = await fetch(`${API}/multa/${multaId}/discharge-checkout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});
const payment = await checkout.json();
assert(
  checkout.ok && typeof payment.url === "string" && payment.url.length > 0,
  `❌ Pago falla (${checkout.status}). ¿STRIPE_SECRET_KEY en el servidor? ${JSON.stringify(payment)}`
);
console.log("✅ Flujo de pago funciona");

console.log("\n🎉 TODOS LOS TESTS DE INTEGRACIÓN PASARON\n");
