import fs from "node:fs";
import path from "node:path";

const enginePath = path.resolve(process.cwd(), "core", "analysisEngine.ts");
const source = fs.readFileSync(enginePath, "utf8");

const requiredPatterns = [
  /export type AnalysisEngineInput = Readonly<\{/,
  /export type AnalysisEngineContract = Readonly<\{/,
  /export function generateResultadoAnalisis\(\s*patente: string,\s*provinciaSeleccionada: string \| null,\s*legalContext\?: LegalContext\s*\): AnalysisResult/s,
  /export const analysisEngine_v1: AnalysisEngineContract = Object\.freeze\(/,
  /version:\s*"v1"/,
];

const missing = requiredPatterns
  .map((pattern, idx) => ({ pattern, idx }))
  .filter(({ pattern }) => !pattern.test(source))
  .map(({ idx }) => idx + 1);

if (missing.length > 0) {
  console.error(
    `[engine-contract-check] Missing required contract pattern(s): ${missing.join(", ")}`
  );
  process.exit(1);
}

console.log("[engine-contract-check] Contract signature v1 verified.");
