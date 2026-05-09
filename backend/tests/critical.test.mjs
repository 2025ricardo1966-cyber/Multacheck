import assert from "node:assert/strict";

const API = process.env.CRITICAL_TEST_API?.trim() || "http://localhost:3000/api";

if (typeof globalThis.fetch !== "function") {
  console.error("❌ Se requiere Node.js 18+ (fetch global)");
  process.exit(1);
}

let token = "";
let multaId = "";

console.log("🧪 TESTS CRÍTICOS MULTACHECK\n");

function isConnRefused(err) {
  return (
    err?.code === "ECONNREFUSED" ||
    err?.cause?.code === "ECONNREFUSED"
  );
}

// Test 1: Servidor vivo
let health;
try {
  health = await fetch(`${API}/health`);
} catch (err) {
  assert.fail(
    isConnRefused(err)
      ? `❌ Sin servidor en ${API}. Levantá la API (npm run dev) antes de npm run test:critical.`
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

// Test 2: Registro (respuesta real: { token, user }, sin wrapper success/data)
const register = await fetch(`${API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: `test${Date.now()}@test.com`,
    password: "Test1234!",
    name: "Test User",
  }),
});
const regData = await register.json();
assert(register.ok && regData.token, `❌ Registro falla: ${JSON.stringify(regData)}`);
token = regData.token;
console.log("✅ Registro funciona");

// Test 3: Análisis de multa (respuesta: { success, data: { multaId, ... } })
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
assert(analyze.ok && multa.success && multa.data?.multaId, `❌ Análisis falla: ${JSON.stringify(multa)}`);
multaId = multa.data.multaId;
console.log("✅ Análisis funciona");

const stripeReady = healthJson.checks?.stripe === "configured";
if (!stripeReady) {
  console.log(
    "⚠️ Omitiendo checkout Stripe (`checks.stripe` ≠ configured en /health)."
  );
  console.log("\n🎉 Tests críticos pasaron (core OK; Stripe no configurado)\n");
  process.exit(0);
}

// Test 4: Checkout de pago (respuesta real: { url, sessionId, multaId, ... }, sin wrapper success/data)
// Requiere STRIPE_SECRET_KEY en el servidor y en este proceso si usás Stripe real.
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

console.log("\n🎉 TODOS LOS TESTS CRÍTICOS PASARON\n");
