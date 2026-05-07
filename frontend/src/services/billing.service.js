import { api } from "./api.js";

export async function fetchPublicPlans() {
  const { data } = await api.get("/plans");
  return data.plans;
}

export async function createCheckoutSession(tier) {
  const { data } = await api.post("/billing/checkout-session", { tier });
  return data.url;
}

export async function createPortalSession() {
  const { data } = await api.post("/billing/portal-session");
  return data.url;
}
