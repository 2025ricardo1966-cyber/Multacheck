import crypto from "crypto";

function buildLockBigInt(key) {
  const hash = crypto
    .createHash("sha256")
    .update(String(key))
    .digest("hex")
    .slice(0, 15);

  return BigInt(`0x${hash}`);
}

/**
 * Transaction-scoped PostgreSQL advisory lock (released automatically at COMMIT/ROLLBACK).
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {string} key
 * @param {() => unknown | Promise<unknown>} fn
 */
export async function withAdvisoryLock(tx, key, fn) {
  const lockId = buildLockBigInt(key);

  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${lockId.toString()})`
  );

  return await fn();
}
