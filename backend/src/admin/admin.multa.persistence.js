import { prisma } from "../config/database.js";

export function findMultaDebugById(multaId) {
  return prisma.multa.findUnique({
    where: { id: multaId },
    include: {
      opsEvents: {
        orderBy: { createdAt: "desc" },
        take: 500,
      },
    },
  });
}
