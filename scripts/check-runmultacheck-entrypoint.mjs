import { execSync } from "node:child_process";

const rgCommand = [
  "rg",
  '-n',
  '--glob', '"!core/**"',
  '--glob', '"!scripts/**"',
  '--glob', '"!.github/**"',
  '--glob', '"!node_modules/**"',
  '--glob', '"!.next/**"',
  '"from\\s+[\\\"\\\'][^\\\"\\\']*analysisEngine[^\\\"\\\']*[\\\"\\\']"',
  ".",
].join(" ");

let output = "";
try {
  output = execSync(rgCommand, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch (error) {
  output = String(error?.stdout ?? "").trim();
}

if (output.length > 0) {
  console.error("[runmultacheck-entrypoint-check] Direct analysisEngine import detected outside core:");
  console.error(output);
  process.exit(1);
}

console.log("[runmultacheck-entrypoint-check] OK: no entrypoint bypass detected.");
