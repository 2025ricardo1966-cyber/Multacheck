/**
 * CORE STABLE - DO NOT MODIFY WITHOUT VERSIONING
 *
 * API pública del core de MULTACHECK.
 * La UI debe consumir únicamente exports de este módulo.
 */

export {
  runMultaCheck,
  normalizeProductOutput,
  filterByRole,
  type ProductLegalContext,
  type ProductOutput,
  type ProductResult,
  type UserRole,
} from "./runMultaCheck";

export {
  type AnalysisResult,
  type LegalContext,
  type AnalysisEngineInput,
  type AnalysisEngineContract,
  type ExternalConstraintDetected,
} from "./analysisEngine";

export {
  runSimulationSuite,
  generateSimulationReport,
  type SimulationReport,
} from "./simulation/multaSimulator";

export {
  type AnalysisError,
  type AnalysisErrorSeverity,
  type AnalysisErrorType,
  classifyAnalysisError,
  getAnalysisErrorReport,
  clearAnalysisErrorReport,
} from "./errors/analysisError";
