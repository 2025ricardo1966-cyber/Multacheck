import { api } from "./api.js";

export async function fetchAnalyticsOverview() {
  const { data } = await api.get("/analytics/overview");
  return data;
}

export async function fetchAnalyticsTenant() {
  const { data } = await api.get("/analytics/tenant");
  return data;
}

export async function fetchAnalyticsUsage() {
  const { data } = await api.get("/analytics/usage");
  return data;
}
