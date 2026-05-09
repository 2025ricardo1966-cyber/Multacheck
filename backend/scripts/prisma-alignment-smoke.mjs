/**
 * Validación mínima post-schema: analyzeAndPersist + lectura DB.
 * Ejecutar: node scripts/prisma-alignment-smoke.mjs (desde backend/)
 */
import "dotenv/config";
import { prisma } from "../src/config/database.js";
import { analyzeAndPersist } from "../src/multas/multa.persistence.js";

const user = await prisma.user.findFirst({
  where: { status: "active" },
  select: { id: true, tenantId: true },
});

if (!user?.id || !user?.tenantId) {
  console.error("FAIL_NO_ACTIVE_USER");
  process.exit(1);
}

const authContext = {
  userId: user.id,
  tenantId: user.tenantId,
  authType: "jwt",
};

const body = {
  country: "AR",
  type: "transito",
  description: "test-prisma-fix",
};

const out = await analyzeAndPersist(authContext, body, {});

if (!out?.success || !out?.data?.multaId) {
  console.error("FAIL_ANALYZE", JSON.stringify(out));
  process.exit(2);
}

const row = await prisma.multa.findUnique({
  where: { id: out.data.multaId },
  select: {
    id: true,
    tenantId: true,
    userId: true,
    requestHash: true,
    idempotencyKey: true,
    caseState: true,
    rawInput: true,
    country: true,
    type: true,
    description: true,
  },
});

console.log(
  JSON.stringify({ analyzeResult: out, persistedRow: row }, null, 2)
);

await prisma.$disconnect();
process.exit(0);
