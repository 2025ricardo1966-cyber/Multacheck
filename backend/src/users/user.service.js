import { prisma } from "../config/database.js";

export async function findUserByAuthContext(authContext) {
  const userId = authContext?.userId;
  const tenantId = authContext?.tenantId;
  if (!userId || !tenantId) {
    throw new Error("Missing authenticated user context");
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  return user;
}

export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export function findUserByEmailInTenant(email, tenantId) {
  return prisma.user.findFirst({
    where: {
      email: email?.trim().toLowerCase(),
      tenantId,
    },
  });
}

export function createUserInTenant({ tenantId, email, passwordHash, role }) {
  return prisma.user.create({
    data: {
      tenantId,
      email: email?.trim().toLowerCase(),
      password: passwordHash,
      role: role ?? "user",
      status: "active",
    },
  });
}
