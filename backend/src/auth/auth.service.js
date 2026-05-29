import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { createTenantAndUserForRegister } from "./auth.persistence.js";
import { resolveTenantSlug } from "./auth.slug.js";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw httpError("JWT_SECRET no configurado", 500);
  }
  return secret;
}

function httpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function signAuthToken(userId, tenantId) {
  return jwt.sign(
    {
      sub: userId,
      userId,
      tenantId,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d" }
  );
}

export async function register({ email, password, companyName, companySlug }) {
  if (!email?.trim() || !password) {
    throw httpError("Missing credentials", 400);
  }
  if (!companyName?.trim()) {
    throw httpError("companyName is required", 400);
  }

  const name = companyName.trim();
  const slug = resolveTenantSlug(name, companySlug);
  if (!slug) {
    throw httpError("Invalid company slug", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let result;
  try {
    result = await createTenantAndUserForRegister({
      email: email.trim().toLowerCase(),
      hashedPassword,
      companyName: name,
      slug,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      throw httpError("Slug already taken", 409);
    }
    throw err;
  }

  const token = signAuthToken(result.user.id, result.tenant.id);

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
    },
  };
}

export async function login({ email, password, tenantSlug }) {
  if (!email?.trim() || !password || !tenantSlug?.trim()) {
    throw httpError("Missing credentials", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedSlug = tenantSlug.trim().toLowerCase();

  const tenant = await prisma.tenant.findUnique({
    where: { slug: normalizedSlug },
  });
  if (!tenant) {
    throw httpError("Tenant not found", 401);
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      tenantId: tenant.id,
    },
  });
  if (!user) {
    throw httpError("User not found", 401);
  }

  if (user.status !== "active") {
    throw httpError("User not found", 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw httpError("Invalid password", 401);
  }

  const token = signAuthToken(user.id, tenant.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
  };
}
