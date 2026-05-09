import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const errorModelPath = path.resolve(projectRoot, "core", "errors", "analysisError.ts");
const runMultaCheckPath = path.resolve(projectRoot, "core", "runMultaCheck.ts");

const errorModel = fs.readFileSync(errorModelPath, "utf8");
const runMultaCheck = fs.readFileSync(runMultaCheckPath, "utf8");

const requiredErrorModelSnippets = [
  "export type AnalysisErrorType",
  '"ENGINE_ERROR"',
  '"VALIDATION_ERROR"',
  '"CONFIG_ERROR"',
  '"QUALITY_WARNING"',
  "export type AnalysisErrorSeverity",
  '"critical"',
  '"high"',
  '"medium"',
  '"low"',
  'input.stage === "engine"',
  'input.stage === "validation"',
  'input.stage === "consistency"',
];

const requiredRunFlowPatterns = [
  /classifyAnalysisError\(/,
  /stage:\s*"engine"/,
  /stage:\s*"validation"/,
  /stage:\s*"sanitize"/,
  /releaseReadinessCheck\(/,
  /buildSafeFallbackOutput\(/,
];

const missingModel = requiredErrorModelSnippets.filter((snippet) => !errorModel.includes(snippet));
const missingFlow = requiredRunFlowPatterns.filter((pattern) => !pattern.test(runMultaCheck));

if (missingModel.length > 0 || missingFlow.length > 0) {
  console.error("[analysis-error-policy-check] Missing required policy patterns.");
  console.error(`- model missing: ${missingModel.length}`);
  console.error(`- flow missing: ${missingFlow.length}`);
  process.exit(1);
}

console.log("[analysis-error-policy-check] Error classification policy verified.");
