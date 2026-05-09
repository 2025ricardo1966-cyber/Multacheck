/**
 * Origen único del API en local/CI: siempre puerto 3000 salvo MULTACHECK_API.
 * Debe coincidir con `OFFICIAL_API_PORT` en env.js y con el proxy de Vite.
 */
export const OFFICIAL_API_BASE_URL = "http://localhost:3000/api";

export function resolveOfficialApiBase() {
  const raw = process.env.MULTACHECK_API?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return OFFICIAL_API_BASE_URL;
}
