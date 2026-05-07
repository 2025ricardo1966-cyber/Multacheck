import { prisma } from "../config/database.js";
import { safeTransaction } from "../db/safeTransaction.js";

export function findUsageDaily(tenantId, dateKey) {
  return prisma.usageDaily.findUnique({
    where: { tenantId_dateKey: { tenantId, dateKey } },
  });
}

/**
 * Increment daily analyze count: find-or-create inside a transaction (no upsert).
 * Concurrent creates resolve via P2002 → update increment.
 */
export function upsertUsageDaily(tenantId, dateKey) {
  return safeTransaction(async (tx) => {
    const existing = await tx.usageDaily.findUnique({
      where: { tenantId_dateKey: { tenantId, dateKey } },
    });

    if (existing) {
      return tx.usageDaily.update({
        where: { tenantId_dateKey: { tenantId, dateKey } },
        data: { analyzeCount: { increment: 1 } },
      });
    }

    try {
      return await tx.usageDaily.create({
        data: { tenantId, dateKey, analyzeCount: 1 },
      });
    } catch (err) {
      if (err?.code !== "P2002") {
        throw err;
      }
      return tx.usageDaily.update({
        where: { tenantId_dateKey: { tenantId, dateKey } },
        data: { analyzeCount: { increment: 1 } },
      });
    }
  });
}

export function countMultasForTenant(tenantId) {
  return prisma.multa.count({ where: { tenantId } });
}

export function countMultasForUser(tenantId, userId) {
  return prisma.multa.count({ where: { tenantId, userId } });
}
