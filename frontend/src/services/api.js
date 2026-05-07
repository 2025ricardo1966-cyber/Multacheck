import axios from "axios";

/**
 * Desarrollo: base `/api` (proxy Vite → backend).
 * Producción: `VITE_API_URL` (origen público del backend, incluyendo `/api`).
 */
export function resolveApiBaseURL() {
  if (import.meta.env.DEV) {
    return "/api";
  }

  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) {
    console.warn(
      "[MultaCheck] VITE_API_URL no está definida: configurá la URL del backend en el build."
    );
    return "";
  }

  return raw.replace(/\/$/, "");
}

export const api = axios.create({
  baseURL: resolveApiBaseURL(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("multacheck_token")
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
