import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "../../.env") });

const portParsed = Number(process.env.PORT);
export const PORT =
  Number.isInteger(portParsed) && portParsed >= 1 && portParsed <= 65535
    ? portParsed
    : 3000;
