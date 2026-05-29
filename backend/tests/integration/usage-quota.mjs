/**
 * Cuota diaria analyze (plan free = 5/día). Requiere API en CRITICAL_TEST_API.
 */
import assert from "node:assert/strict";

const API = process.env.CRITICAL_TEST_API?.trim() || "http://localhost:3000/api";

if (typeof globalThis.fetch !== "function") {
  console.error("❌ Node.js 18+ requerido");
  process.exit(1);
}

let health;
try {
  health = await fetch(`${API}/health`);
} catch (e) {
  assert.fail(
    e?.code === "ECONNREFUSED"
      ? `Sin servidor en ${API}`
      : String(e)
  );
}
assert(health.ok, "health");

const ts = Date.now();
const reg = await fetch(`${API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: `quota${ts}@test.com`,
    password: "Test1234!",
    companyName: `Quota Co ${ts}`,
  }),
});
const regJ = await reg.json();
assert(reg.ok && regJ.token, JSON.stringify(regJ));
const token = regJ.token;
const slug = regJ.user.tenantSlug;

const statuses = [];
for (let i = 0; i < 6; i++) {
  const r = await fetch(`${API}/multa/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      country: "AR",
      type: "transito",
      description: `quota test ${ts} #${i}`,
    }),
  });
  statuses.push(r.status);
}

assert.equal(
  statuses.filter((s) => s === 200).length,
  5,
  `expected 5x 200, got ${JSON.stringify(statuses)}`
);
assert.equal(statuses[5], 429, `6th must be 429, got ${statuses[5]}`);

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: regJ.user.email,
    password: "Test1234!",
    tenantSlug: slug,
  }),
});
assert(login.ok, "login after quota test");

console.log("✅ usage quota: 5x200 + 1x429", statuses);
