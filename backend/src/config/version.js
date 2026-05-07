import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, "../../package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

export const APP_VERSION = pkg.version ?? "1.0.0";
export const APP_NAME = pkg.name ?? "multacheck-backend";
