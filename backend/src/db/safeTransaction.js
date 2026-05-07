import prisma from "./prisma.js";

const MAX_RETRIES = 5;

/**
 * Interactive Serializable transactions with retries on transient concurrency errors.
 * @param {(tx: import("@prisma/client").Prisma.TransactionClient) => Promise<unknown>} fn
 * @param {Record<string, unknown>} [transactionOptions] e.g. maxWait, timeout
 */
export async function safeTransaction(fn, transactionOptions = {}) {
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i += 1) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: "Serializable",
        ...transactionOptions,
      });
    } catch (e) {
      lastError = e;

      const msg = String(e?.message || e);
      const code = e?.code;

      const isRetryable =
        code === "P2034" ||
        msg.includes("P2034") ||
        msg.includes("write conflict") ||
        msg.includes("deadlock") ||
        msg.includes("could not serialize access") ||
        msg.includes("Serialization failure");

      if (!isRetryable) throw e;
    }
  }

  throw lastError;
}
