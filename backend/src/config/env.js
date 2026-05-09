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
