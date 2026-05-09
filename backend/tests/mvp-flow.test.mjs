/**
 * Flujo MVP completo contra API real (health → register → analyze → checkout).
 * Requiere servidor, DB y STRIPE_SECRET_KEY configurados.
 *
 * Base URL: MVP_TEST_API | CRITICAL_TEST_API | http://localhost:3000/api
 */
import assert from "assert";

const API =
  process.env.MVP_TEST_API?.trim() ||
  process.env.CRITICAL_TEST_API?.trim() ||
  "http://localhost:3000/api";

const timestamp = Date.now();

if (typeof globalThis.fetch !== "function") {
  console.error("❌ Node.js 18+ requerido (fetch global)");
  process.exit(1);
}

console.log("🧪 MVP CRITICAL FLOW TEST\n");

let token;
let multaId;
let phase = "init";

function scoreFromMulta(multa) {
  return multa?.data?.score ?? multa?.data?.resultJson?.scoring?.finalScore;
}

try {
  phase = "health";
  console.log("1️⃣ Testing health...");
  let health;
  try {
    health = await fetch(`${API}/health`);
  } catch (e) {
    if (e?.code === "ECONNREFUSED" || e?.cause?.code === "ECONNREFUSED") {
      throw new Error(`Sin servidor en ${API}. Ejecutá npm start antes del test.`);
    }
    throw e;
  }
  const h = await health.json();
  assert.strictEqual(h.status, "healthy");
  assert.strictEqual(h.checks.database, "ok");
  assert.notStrictEqual(h.checks.stripe, "missing");
  console.log("   ✅ System healthy\n");

  phase = "registration";
  console.log("2️⃣ Testing registration...");
  const register = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `test${timestamp}@mvp.com`,
      password: "Test123!",
      name: "MVP User",
    }),
  });
  const reg = await register.json();
  assert.ok(
    register.ok && typeof reg.token === "string" && reg.token.length > 0,
    JSON.stringify(reg)
  );
  token = reg.token;
  console.log("   ✅ User registered\n");

  phase = "analyze";
  console.log("3️⃣ Testing multa analysis...");
  const analyze = await fetch(`${API}/multa/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      country: "AR",
      type: "exceso_velocidad",
      description: "Test: 130 km/h en zona 110",
      amount: 50000,
    }),
  });
  const multa = await analyze.json();
  assert.strictEqual(multa.success, true, JSON.stringify(multa));
  multaId = multa.data.multaId;
  const sc = scoreFromMulta(multa);
  assert.ok(sc !== undefined && sc !== null, "Sin score en respuesta");
  console.log(
    `   ✅ Analysis complete: ${multa.data.trafficLight} (score: ${sc})\n`
  );

  phase = "checkout";
  console.log("4️⃣ Testing payment checkout...");
  const checkout = await fetch(`${API}/multa/${multaId}/discharge-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const payment = await checkout.json();
  assert.ok(
    checkout.ok &&
      typeof payment.url === "string" &&
      payment.url.length > 0,
    `${checkout.status} ${JSON.stringify(payment)}`
  );
  console.log("   ✅ Checkout created\n");
  console.log(`   🔗 URL: ${payment.url}\n`);

  console.log("🎉 ALL TESTS PASSED - MVP READY!\n");
} catch (error) {
  console.error(
    "\n❌ TEST FAILED:",
    error?.message || String(error),
    `\n   (paso: ${phase})\n`
  );
  process.exit(1);
}
