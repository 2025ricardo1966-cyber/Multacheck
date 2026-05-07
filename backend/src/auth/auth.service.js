import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createTenantAndUserForRegister } from "./auth.persistence.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function register({ email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await createTenantAndUserForRegister({ email, hashedPassword });

  const token = jwt.sign(
    {
      sub: result.user.id,
      userId: result.user.id,
      tenantId: result.tenant.id,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
    },
  };
}