import { api } from "./api.js";

export async function analyzeMulta(payload) {
  const { data } = await api.post("/multa/analyze", payload);
  return data;
}

export async function createDischargeCheckout(multaId) {
  const { data } = await api.post(`/multa/${multaId}/discharge-checkout`);
  return data?.url ?? null;
}

export async function fetchPaymentStatus(multaId) {
  const { data } = await api.get(`/multa/${multaId}/state`);
  return data;
}

export async function fetchMultaFullState(multaId) {
  const { data } = await api.get(`/multa/${multaId}/full-state`);
  return data;
}

export async function fetchDischarge(multaId) {
  const { data } = await api.get(`/multa/${multaId}/discharge`);
  return data;
}
