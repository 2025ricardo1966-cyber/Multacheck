/**
 * Flujo MVP end-to-end contra API real (legacy). Usar test:integration:mvp preferentemente.
 */
import assert from "node:assert/strict";

const API =
  process.env.MVP_TEST_API?.trim() ||
  process.env.CRITICAL_TEST_API?.trim() ||
  "http://localhost:3000/api";

let token = "";
let multaId = "";

if (typeof globalThis.fetch !== "function") {
  console.error("❌ Se requiere Node.js 18+ (fetch global)");
  process.exit(1);
}

function isConnRefused(err) {
  return err?.code === "ECONNREFUSED" || err?.cause?.code === "ECONNREFUSED";
}

console.log("🧪 MVP CRITICAL PATH TEST (legacy)\n");

let health;
try {
  health = await fetch(`${API}/health`);
} catch (err) {
  assert.fail(
    isConnRefused(err)
      ? `❌ Sin servidor en ${API}. Levantá la API (npm start) antes del test.`
      : String(err)
  );
}
const healthData = await health.json();
assert.ok(["healthy", "degraded"].includes(healthData.status), "❌ System unhealthy");
assert.strictEqual(healthData.checks.database, "ok", "❌ DB down");
console.log("✅ System healthy");

const register = await fetch(`${API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: `mvp${Date.now()}@test.com`,
    password: "TestMVP123!",
    companyName: "MVP Test",
  }),
});
const regData = await register.json();
assert.ok(
  register.ok && typeof regData.token === "string" && regData.token.length > 0,
  `❌ Register failed: ${JSON.stringify(regData)}`
);
token = regData.token;
console.log("✅ User registration");

const analyze = await fetch(`${API}/multa/analyze`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    country: "AR",
    type: "exceso_velocidad",
    description: "Exceso 120 km/h en zona 100 km/h",
    amount: 50000,
    date: "2026-05-01",
  }),
});
const multaData = await analyze.json();
assert.strictEqual(
  multaData.success,
  true,
  `❌ Analysis failed: ${JSON.stringify(multaData)}`
);
multaId = multaData.data.multaId;
assert.ok(multaData.data.trafficLight, "❌ No traffic light");
const score =
  multaData.data.score ?? multaData.data.resultJson?.scoring?.finalScore;
assert.ok(score !== undefined && score !== null, "❌ No score");
console.log(
  `✅ Multa analyzed: ${multaData.data.trafficLight} light, score ${score}`
);

if (healthData.checks?.stripe !== "configured") {
  console.log("\n🎉 MVP legacy OK (sin Stripe)\n");
  process.exit(0);
}

const checkout = await fetch(`${API}/multa/${multaId}/discharge-checkout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});
const checkoutData = await checkout.json();
assert.ok(
  checkout.ok &&
    typeof checkoutData.url === "string" &&
    checkoutData.url.length > 0,
  `❌ Checkout failed: ${checkout.status} ${JSON.stringify(checkoutData)}`
);
console.log("✅ Payment checkout created");

console.log("\n🎉 ALL MVP TESTS PASSED\n");
