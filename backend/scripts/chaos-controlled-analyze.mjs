/**
 * Chaos controlado sobre analyzeAndPersist con instrumentación real:
 * `multa.persistence` envuelve `tx.multa.create` solo si CHAOS_TEST_INSTRUMENT=1.
 *
 * Desde backend/:
 *   node scripts/chaos-controlled-analyze.mjs
 *
 * Variables opcionales:
 *   CHAOS_TOTAL=500
 *   CHAOS_CONCURRENCY=25   (500 tareas en cola; evita saturar PG/Ollama)
 *   (failRate fijo 0.2 en código cuando CHAOS_TEST_INSTRUMENT=1)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOTAL = Math.max(1, parseInt(process.env.CHAOS_TOTAL ?? "500", 10));
const CONCURRENCY = Math.max(1, parseInt(process.env.CHAOS_CONCURRENCY ?? "25", 10));

let prismaMirrorChaosDb = 0;
let unexpectedUnhandledRejections = 0;

process.on("unhandledRejection", (reason) => {
  const msg = reason?.message ?? String(reason);
  const code = reason?.code;
  if (
    code === "CHAOS_DB_SIMULATED_FAILURE" ||
    msg === "CHAOS_DB_SIMULATED_FAILURE" ||
    msg.includes("CHAOS_DB_SIMULATED_FAILURE")
  ) {
    prismaMirrorChaosDb++;
    return;
  }
  unexpectedUnhandledRejections++;
  console.error(
    JSON.stringify({
      tag: "CHAOS_UNHANDLED_REJECTION",
      message: msg,
      code,
    })
  );
});

async function mapPool(limit, tasks, worker) {
  let idx = 0;
  const results = new Array(tasks.length);
  async function runWorker() {
    while (true) {
      const i = idx++;
      if (i >= tasks.length) break;
      results[i] = await worker(tasks[i], i);
    }
  }
  const runners = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    runWorker()
  );
  await Promise.all(runners);
  return results;
}

function setChaosInstrumented(on) {
  if (on) {
    process.env.CHAOS_TEST_INSTRUMENT = "1";
  } else {
    delete process.env.CHAOS_TEST_INSTRUMENT;
  }
}

async function main() {
  delete process.env.CHAOS_TEST_INSTRUMENT;

  const { prisma } = await import("../src/config/database.js");
  const { analyzeAndPersist } = await import("../src/multas/multa.persistence.js");

  const user = await prisma.user.findFirst({
    where: { status: "active" },
    select: { id: true, tenantId: true },
  });

  if (!user?.id || !user?.tenantId) {
    console.error("CHAOS_ABORT_NO_USER");
    process.exit(1);
  }

  const authContext = {
    userId: user.id,
    tenantId: user.tenantId,
    authType: "jwt",
  };

  const countries = ["AR", "CL", "UY"];
  const types = ["transito", "estacionamiento", "velocidad"];

  const sharedBodies = Array.from({ length: 12 }, (_, i) => ({
    country: countries[i % countries.length],
    type: types[i % types.length],
    description: `CHAOS_SHARED_HASH_${i}_${authContext.tenantId.slice(0, 8)}`,
  }));

  const sharedKeys = Array.from({ length: 40 }, (_, i) => `chaos-idem-${i}`);

  const tasks = [];
  for (let i = 0; i < TOTAL; i++) {
    const hashDup = i % 10 < 3;
    const idemDup = i % 10 < 2;

    const body = hashDup
      ? sharedBodies[i % sharedBodies.length]
      : {
          country: countries[i % countries.length],
          type: types[i % types.length],
          description: `CHAOS_UNIQ_${i}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        };

    const opts = idemDup
      ? { idempotencyKey: sharedKeys[i % sharedKeys.length] }
      : {};

    tasks.push({ i, body, opts });
  }

  async function runAnalyzeOne(task) {
    const started = Date.now();
    try {
      const out = await analyzeAndPersist(authContext, task.body, task.opts);
      return {
        ok: true,
        ms: Date.now() - started,
        out,
        task,
      };
    } catch (e) {
      return {
        ok: false,
        ms: Date.now() - started,
        error: e?.message ?? String(e),
        code: e?.code,
        task,
      };
    }
  }

  console.log("Warmup (instrumentación OFF) …");
  setChaosInstrumented(false);
  await runAnalyzeOne({ body: tasks[0].body, opts: {}, i: -1 });

  setChaosInstrumented(true);
  const failRateUsed = "0.2";
  console.log(
    `Load (instrumentación ON, failRate=${failRateUsed}) ${TOTAL} tasks, concurrency ${CONCURRENCY} …`
  );
  const tLoad0 = Date.now();
  const batchResults = await mapPool(CONCURRENCY, tasks, runAnalyzeOne);
  const loadElapsedSec = (Date.now() - tLoad0) / 1000;

  console.log("Recovery (instrumentación OFF) …");
  setChaosInstrumented(false);
  const recoveryResults = await Promise.all([
    runAnalyzeOne({
      body: {
        country: "AR",
        type: "transito",
        description: `CHAOS_RECOVERY_${Date.now()}`,
      },
      opts: {},
    }),
    runAnalyzeOne({
      body: {
        country: "UY",
        type: "velocidad",
        description: `CHAOS_RECOVERY_${Date.now()}_b`,
      },
      opts: {},
    }),
  ]);

  const recoveryOk =
    recoveryResults.every((r) => r.ok && r.out?.success && r.out?.data?.multaId);

  const isChaosSimulatedError = (r) =>
    !r.ok &&
    (r.code === "CHAOS_DB_SIMULATED_FAILURE" ||
      r.error === "CHAOS_DB_SIMULATED_FAILURE");

  const successes = batchResults.filter(
    (r) => r.ok && r.out?.success && r.out?.data?.multaId
  );
  const chaosThrows = batchResults.filter(isChaosSimulatedError);
  const otherBizFail = batchResults.filter(
    (r) => r.ok && !r.out?.success
  );
  const unexpectedThrows = batchResults.filter(
    (r) => !r.ok && !isChaosSimulatedError(r)
  );

  const dupRows = await prisma.$queryRaw`
    SELECT "tenantId", "userId", "requestHash", COUNT(*)::int AS c
    FROM "Multa"
    WHERE "tenantId" = ${authContext.tenantId} AND "userId" = ${authContext.userId}
    GROUP BY "tenantId", "userId", "requestHash"
    HAVING COUNT(*) > 1
  `;

  const idemKeyToMultaIds = new Map();
  for (let i = 0; i < batchResults.length; i++) {
    const idem = tasks[i].opts?.idempotencyKey;
    if (!idem) continue;
    const r = batchResults[i];
    if (!r.ok || !r.out?.success || !r.out?.data?.multaId) continue;
    if (!idemKeyToMultaIds.has(idem)) idemKeyToMultaIds.set(idem, new Set());
    idemKeyToMultaIds.get(idem).add(r.out.data.multaId);
  }
  let idempotencyViolations = 0;
  for (const ids of idemKeyToMultaIds.values()) {
    if (ids.size > 1) idempotencyViolations++;
  }

  let silentFailures = 0;
  if (batchResults.some((r) => r === undefined)) silentFailures++;
  silentFailures += unexpectedUnhandledRejections;

  const successMultaIds = [...new Set(successes.map((r) => r.out.data.multaId))];
  const persistedOk =
    successMultaIds.length === 0
      ? true
      : (await prisma.multa.count({
          where: {
            tenantId: authContext.tenantId,
            userId: authContext.userId,
            id: { in: successMultaIds },
          },
        })) === successMultaIds.length;

  const passConsistency = dupRows.length === 0 && persistedOk;
  const passIdempotency = dupRows.length === 0 && idempotencyViolations === 0;
  const passCrash = unexpectedUnhandledRejections === 0;
  const passSystemStability =
    unexpectedUnhandledRejections === 0 &&
    silentFailures === 0 &&
    recoveryOk &&
    unexpectedThrows.length === 0;
  const productionReady =
    passIdempotency &&
    passConsistency &&
    passCrash &&
    passSystemStability &&
    otherBizFail.length === 0;

  const simulatedFailures = chaosThrows.length;

  const report = {
    totalRequests: TOTAL,
    concurrencyCap: CONCURRENCY,
    chaosInstrumentFailRate: 0.2,
    loadElapsedSec: Number(loadElapsedSec.toFixed(2)),
    throughputApprox: Number((TOTAL / loadElapsedSec).toFixed(2)),
    successfulWrites: successes.length,
    simulatedFailures,
    analyzeReturnedBizFail: otherBizFail.length,
    analyzeThrewUnexpected: unexpectedThrows.length,
    recoveryRequestsOk: recoveryOk,
    duplicateRequestHashRowsInDb: dupRows.length,
    idempotencyKeyMultipleMultaIdsViolations: idempotencyViolations,
    prismaMirrorChaosDbRejections: prismaMirrorChaosDb,
    unexpectedUnhandledRejections,
    silentFailures,
    gates: {
      idempotency: passIdempotency ? "PASS" : "FAIL",
      dataConsistency: passConsistency ? "PASS" : "FAIL",
      systemStability: passSystemStability ? "PASS" : "FAIL",
      crashResistance: passCrash ? "PASS" : "FAIL",
      productionReady,
    },
  };

  const outPath = path.join(__dirname, "chaos-controlled-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  console.log(`
🟢 CHAOS ENGINEERING REPORT

Total requests: ${TOTAL}
Successful writes: ${report.successfulWrites}
Simulated failures: ${simulatedFailures}
Recovered successfully: ${recoveryOk ? "YES" : "NO"}

Idempotency: ${report.gates.idempotency}
Data consistency: ${report.gates.dataConsistency}
System stability: ${report.gates.systemStability}
Crash resistance: ${report.gates.crashResistance}

SYSTEM STATUS:
${productionReady ? "PRODUCTION READY" : "NOT READY"}
`);

  await prisma.$disconnect();

  process.exit(
    dupRows.length > 0 ||
      idempotencyViolations > 0 ||
      !recoveryOk ||
      !persistedOk ||
      silentFailures > 0 ||
      unexpectedThrows.length > 0 ||
      otherBizFail.length > 0
      ? 2
      : 0
  );
}

main().catch(async (e) => {
  console.error(e);
  try {
    const { prisma } = await import("../src/config/database.js");
    await prisma.$disconnect();
  } catch (disconnectErr) {
    console.error(
      JSON.stringify({
        tag: "CHAOS_PRISMA_DISCONNECT_FAILED",
        message: disconnectErr?.message ?? String(disconnectErr),
      })
    );
  }
  process.exit(1);
});
