import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "../../.env") });

/** Puerto oficial local (proxy Vite, Stripe CLI forward, `npm run e2e`). En PaaS usar `PORT` del proveedor. */
export const OFFICIAL_API_PORT = 3000;

const portParsed = Number(process.env.PORT);
export const PORT =
  Number.isInteger(portParsed) && portParsed >= 1 && portParsed <= 65535
    ? portParsed
    : OFFICIAL_API_PORT;

/** Solo desarrollo: si el puerto solicitado está ocupado, probar PORT+1… (nunca en production). */
export function multacheckAutoIncrementPortEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  const v = process.env.MULTACHECK_AUTO_INCREMENT_PORT?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Cuántos puertos adicionales probar tras PORT (incluye solo offsets positivos). Máx. 50. */
export function multacheckAutoIncrementMax() {
  const n = Number(process.env.MULTACHECK_AUTO_INCREMENT_MAX ?? 10);
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(Math.floor(n), 50);
}
