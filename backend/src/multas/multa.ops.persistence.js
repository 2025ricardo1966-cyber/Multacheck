import prisma from "../db/prisma.js";
import { CaseState } from "./multaCaseState.js";

export async function createMultaOpsEvent(multaId, event, payload = {}) {
  const safePayload =
    payload && typeof payload === "object" ? payload : {};
  return prisma.multaOpsEvent.create({
    data: {
      multaId,
      event,
      payload: safePayload,
    },
  });
}

export async function updateMultaErrorState(multaId) {
  return prisma.multa.updateMany({
    where: {
      id: multaId,
      caseState: { not: CaseState.FAILED },
    },
    data: {
      caseState: CaseState.FAILED,
    },
  });
}
