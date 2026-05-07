import { prisma } from "../config/database.js";

export function createAuditLog(payload) {
  return prisma.auditLog.create({ data: payload });
}
