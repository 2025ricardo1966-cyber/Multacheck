import { api } from "./api.js";

export async function loginRequest(email, password, tenantSlug) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
    tenantSlug,
  });
  return data;
}

export async function registerRequest(email, password, companyName, companySlug) {
  const body = { email, password, companyName };
  if (companySlug?.trim()) body.companySlug = companySlug.trim().toLowerCase();
  const { data } = await api.post("/auth/register", body);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}
