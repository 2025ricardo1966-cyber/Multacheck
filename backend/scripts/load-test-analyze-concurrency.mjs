/**
 * Carga concurrente sobre analyzeAndPersist (flujo Prisma real).
 * Uso: desde backend/ → node scripts/load-test-analyze-concurrency.mjs
 */
import "dotenv/config";
import crypto from "crypto";
import { prisma } from "../src/config/database.js";
import { analyzeAndPersist } from "../src/multas/multa.persistence.js";

function computeRequestHash(body) {
  const payload = {
    country: String(body?.country ?? "AR"),
    type: String(body?.type ?? "transito"),
    description: String(body?.description ?? "").trim(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

const TOTAL = 1000;
const countries = ["AR", "CL", "UY"];
const types = ["transito", "estacionamiento", "velocidad"];

const COLLISION_DESC = `FIXED_HASH_COLLISION_${Date.now()}`;
const COLLISION_BODY = {
  country: "AR",
  type: "transito",
  description: COLLISION_DESC,
};

async function main() {
  const user = await prisma.user.findFirst({
    where: { status: "active" },
    select: { id: true, tenantId: true },
  });

  if (!user?.id || !user?.tenantId) {
    console.error("FAIL: No hay usuario activo en BD para tenantId/userId.");
    process.exit(1);
  }

  const authContext = {
    userId: user.id,
    tenantId: user.tenantId,
    authType: "jwt",
  };

  const baseline = await prisma.multa.count({
    where: { tenantId: user.tenantId, userId: user.id },
  });

  const tasks = [];
  for (let i = 0; i < TOTAL; i++) {
    const collisionBucket = i < 200;
    const body = collisionBucket
      ? { ...COLLISION_BODY }
      : {
          country: countries[i % countries.length],
          type: types[i % types.length],
          description: `load-${i}-${crypto.randomBytes(6).toString("hex")}`,
        };

    const idempotencyKey =
      i % 10 < 3 ? `idem-dup-${Math.floor(i / 10)}` : `idem-uniq-${i}`;

    tasks.push({ i, body, options: { idempotencyKey } });
  }

  const expectedHash = computeRequestHash(COLLISION_BODY);

  const t0 = Date.now();
  const settled = await Promise.allSettled(
    tasks.map(({ body, options }) =>
      analyzeAndPersist(authContext, body, options)
    )
  );
  const elapsedSec = (Date.now() - t0) / 1000;

  let fulfilledOk = 0;
  let fulfilledFail = 0;
  let prismaErrors = 0;
  let rejected = 0;
  const collisionMultaIds = new Set();
  const idemKeyToMultaId = new Map();
  let idempotencyMismatch = 0;
  let raceSuspected = 0;

  for (let idx = 0; idx < settled.length; idx++) {
    const s = settled[idx];
    if (s.status === "rejected") {
      rejected++;
      const code = s.reason?.code;
      if (code === "P2002" || String(s.reason?.message || "").includes("Prisma"))
        prismaErrors++;
      continue;
    }
    const val = s.value;
    if (!val?.success) {
      fulfilledFail++;
      continue;
    }
    fulfilledOk++;
    const mid = val.data?.multaId;
    if (!mid) continue;

    const { body, options } = tasks[idx];
    if (
      computeRequestHash(body) === expectedHash &&
      body.description === COLLISION_DESC
    ) {
      collisionMultaIds.add(mid);
    }

    const ik = options?.idempotencyKey;
    if (ik?.startsWith?.("idem-dup-")) {
      const prev = idemKeyToMultaId.get(ik);
      if (prev != null && prev !== mid) idempotencyMismatch++;
      else idemKeyToMultaId.set(ik, mid);
    }
  }

  const after = await prisma.multa.count({
    where: { tenantId: user.tenantId, userId: user.id },
  });
  const delta = after - baseline;

  const rowsCollision = await prisma.multa.findMany({
    where: {
      tenantId: user.tenantId,
      userId: user.id,
      requestHash: expectedHash,
    },
    select: { id: true },
  });

  const duplicateControlPass =
    rowsCollision.length <= 1 && collisionMultaIds.size <= 1;
  const racePass = rejected === 0 && prismaErrors === 0;
  const idemPass = idempotencyMismatch === 0;

  process.stdout.write(
    JSON.stringify(
      {
        totalRequests: TOTAL,
        elapsedSec: Number(elapsedSec.toFixed(3)),
        throughputReqPerSec: Number((TOTAL / elapsedSec).toFixed(2)),
        successReturned: fulfilledOk,
        businessFailReturned: fulfilledFail,
        promiseRejected: rejected,
        prismaErrors,
        multasDeltaVsBaseline: delta,
        collisionRowsInDb: rowsCollision.length,
        collisionDistinctIdsReturned: collisionMultaIds.size,
        idempotencyKeyMismatches: idempotencyMismatch,
        duplicateControlPass,
        racePass,
        idemPass,
      },
      null,
      2
    ) + "\n"
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
