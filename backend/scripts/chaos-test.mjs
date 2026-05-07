import "dotenv/config";
import { prisma } from "../src/config/database.js";
import {
  analyzeAndPersist,
  buildAnalyzeRequestHash,
} from "../src/multas/multa.persistence.js";

const TOTAL_REQUESTS = 500;
const UNIQUE_REQUEST_HASH_RATIO = 0.7;
const UNIQUE_IDEMPOTENCY_RATIO = 0.8;
/** Known Multa.lifecycleState values used across persistence / integrity paths (no enum export on persistence). */
const VALID_LIFECYCLE_STATES = new Set([
  "ANALYZED",
  "ERROR_STATE",
  "REPORT_READY",
  "PAID_CONFIRMED",
]);
let chaosUnhandledRejections = 0;
let unexpectedUnhandledRejections = 0;

process.on("unhandledRejection", (reason) => {
  const msg = reason?.message ?? String(reason);
  if (msg.includes("CHAOS_DB_SIMULATED_FAILURE")) {
    chaosUnhandledRejections += 1;
    return;
  }
  unexpectedUnhandledRejections += 1;
  console.error("[CHAOS_TEST_UNHANDLED_REJECTION]", msg);
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildDescriptions(runId) {
  const uniqueCount = Math.floor(TOTAL_REQUESTS * UNIQUE_REQUEST_HASH_RATIO);
  const repeatedCount = TOTAL_REQUESTS - uniqueCount;
  const repeatedPoolSize = Math.max(10, Math.floor(repeatedCount * 0.2));

  const unique = Array.from(
    { length: uniqueCount },
    (_, i) => `chaos-test-${runId}-u-${i}`
  );
  const repeatedPool = Array.from(
    { length: repeatedPoolSize },
    (_, i) => `chaos-test-${runId}-r-${i}`
  );
  const repeated = Array.from(
    { length: repeatedCount },
    (_, i) => repeatedPool[i % repeatedPool.length]
  );

  return shuffle([...unique, ...repeated]);
}

function buildIdempotencyKeys(runId) {
  const uniqueCount = Math.floor(TOTAL_REQUESTS * UNIQUE_IDEMPOTENCY_RATIO);
  const repeatedCount = TOTAL_REQUESTS - uniqueCount;
  const repeatedPoolSize = Math.max(10, Math.floor(repeatedCount * 0.2));

  const unique = Array.from(
    { length: uniqueCount },
    (_, i) => `chaos-idem-${runId}-u-${i}`
  );
  const repeatedPool = Array.from(
    { length: repeatedPoolSize },
    (_, i) => `chaos-idem-${runId}-r-${i}`
  );
  const repeated = Array.from(
    { length: repeatedCount },
    (_, i) => repeatedPool[i % repeatedPool.length]
  );

  return shuffle([...unique, ...repeated]);
}

async function main() {
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const startedAt = new Date();

  const actor = await prisma.user.findFirst({
    select: { id: true, tenantId: true },
  });
  if (!actor?.id || !actor?.tenantId) {
    throw new Error("No se encontro userId/tenantId valido para el test");
  }
  const authContext = { userId: actor.id, tenantId: actor.tenantId };

  const descriptions = buildDescriptions(runId);
  const idempotencyKeys = buildIdempotencyKeys(runId);

  const requests = Array.from({ length: TOTAL_REQUESTS }, (_, i) => {
    const body = {
      country: "AR",
      type: "transito",
      description: descriptions[i],
    };
    return {
      body,
      requestHash: buildAnalyzeRequestHash(body),
      idempotencyKey: idempotencyKeys[i],
    };
  });

  const results = await Promise.all(
    requests.map(async (req) => {
      try {
        const response = await analyzeAndPersist(authContext, req.body, {
          idempotencyKey: req.idempotencyKey,
        });
        return { ...req, ok: Boolean(response?.success), response, error: null };
      } catch (error) {
        return { ...req, ok: false, response: null, error };
      }
    })
  );

  const success = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);
  const simulatedFailures = failures.filter(
    (r) => r.error?.message === "CHAOS_DB_SIMULATED_FAILURE"
  );
  const otherFailures = failures.filter(
    (r) => r.error?.message !== "CHAOS_DB_SIMULATED_FAILURE"
  );

  const requestHashToMultaIds = new Map();
  for (const row of success) {
    const multaId = row.response?.data?.id;
    if (!multaId) continue;
    const set = requestHashToMultaIds.get(row.requestHash) ?? new Set();
    set.add(multaId);
    requestHashToMultaIds.set(row.requestHash, set);
  }
  const idempotencyViolations = Array.from(
    requestHashToMultaIds.values()
  ).filter((ids) => ids.size > 1);

  const uniqueHashes = [...new Set(requests.map((r) => r.requestHash))];
  const dbRows = await prisma.multa.findMany({
    where: {
      tenantId: authContext.tenantId,
      userId: authContext.userId,
      requestHash: { in: uniqueHashes },
      createdAt: { gte: startedAt },
    },
    select: {
      id: true,
      requestHash: true,
      lifecycleState: true,
      tenantId: true,
      userId: true,
      resultJson: true,
    },
  });

  const byHashCount = new Map();
  for (const row of dbRows) {
    byHashCount.set(row.requestHash, (byHashCount.get(row.requestHash) ?? 0) + 1);
  }
  const uniqueConstraintViolations = Array.from(byHashCount.values()).filter(
    (count) => count > 1
  );
  const invalidLifecycleRows = dbRows.filter(
    (row) => !VALID_LIFECYCLE_STATES.has(row.lifecycleState)
  );
  const invalidIdentityRows = dbRows.filter((row) => !row.userId || !row.tenantId);
  const corruptRows = dbRows.filter((row) => row.resultJson == null);

  const report = {
    totalRequests: TOTAL_REQUESTS,
    successCount: success.length,
    simulatedFailureCount: simulatedFailures.length,
    otherErrorCount: otherFailures.length,
    uniqueConstraintViolations: uniqueConstraintViolations.length,
    idempotencyViolations: idempotencyViolations.length,
    invalidLifecycleRows: invalidLifecycleRows.length,
    invalidIdentityRows: invalidIdentityRows.length,
    corruptRows: corruptRows.length,
    chaosUnhandledRejections,
    unexpectedUnhandledRejections,
    processAlive: true,
  };

  console.log("CHAOS_TEST_RESULTS_JSON_START");
  console.log(JSON.stringify(report, null, 2));
  console.log("CHAOS_TEST_RESULTS_JSON_END");

  if (otherFailures.length > 0) {
    const grouped = new Map();
    for (const failure of otherFailures) {
      const key = failure.error?.message ?? "UNKNOWN_ERROR";
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    console.log("OTHER_ERRORS_START");
    console.log(JSON.stringify(Object.fromEntries(grouped), null, 2));
    console.log("OTHER_ERRORS_END");
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[CHAOS_TEST_FATAL]", error);
  await prisma.$disconnect();
  process.exit(1);
});
