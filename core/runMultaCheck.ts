import {
  analysisEngine_v1,
  validateAnalysisResult,
  type AnalysisResult,
  type AnalysisEngineInput,
  type AnalysisEngineContract,
  type LegalContext,
} from "./analysisEngine";
import {
  logAnalysisExecution,
  logAnalysisError,
  maskPatente,
} from "./observabilityLogger";
import {
  classifyAnalysisError,
  registerAnalysisError,
  getAnalysisErrorReport,
  type AnalysisError,
} from "./errors/analysisError";
import { ENV } from "../config/env";

/**
 * CORE STABLE - DO NOT MODIFY WITHOUT VERSIONING
 * Entrypoint único de producto para MULTACHECK.
 */
export type ProductLegalContext = LegalContext;
const ENGINE_CONTRACT: AnalysisEngineContract = analysisEngine_v1;
export type UserRole = "public" | "enterprise" | "admin";

export type ProductOutput = Readonly<{
  pais: string;
  riesgo: "bajo" | "medio" | "alto";
  estado: "impugnable" | "revisable" | "critico";
  recomendacion: string;
  decisionFlow: string[];
  actionPlan: string;
  externalConstraintDetected: AnalysisResult["externalConstraintDetected"];
}>;

export type ProductResult = ProductOutput;

const ALLOWED_PRODUCT_KEYS = new Set([
  "pais",
  "riesgo",
  "estado",
  "recomendacion",
  "decisionFlow",
  "actionPlan",
  "externalConstraintDetected",
]);

function buildSafeFallbackOutput(): ProductOutput {
  return {
    pais: "AR",
    riesgo: "medio",
    estado: "revisable",
    recomendacion:
      "Recomendación: validar documentación y continuar con revisión administrativa.",
    decisionFlow: [
      "Estado actual: revisable.",
      "Verificar documentación disponible.",
      "Definir siguiente acción administrativa.",
    ],
    actionPlan:
      "Revisar antecedentes, confirmar plazos y ejecutar la acción administrativa correspondiente.",
    externalConstraintDetected: null,
  };
}

export function releaseReadinessCheck(result: ProductOutput): ProductOutput {
  const productResult = result;
  const keys = Object.keys(productResult);
  const hasOnlyAllowedKeys = keys.every((key) => ALLOWED_PRODUCT_KEYS.has(key));
  const hasNoUnexpectedKeys = keys.length === ALLOWED_PRODUCT_KEYS.size;
  const paisValido =
    typeof productResult.pais === "string" &&
    ["AR", "CL", "ES", "CO", "UY"].includes(productResult.pais);
  const riesgoValido = ["bajo", "medio", "alto"].includes(productResult.riesgo);
  const estadoValido = ["impugnable", "revisable", "critico"].includes(productResult.estado);
  const recomendacionValida =
    typeof productResult.recomendacion === "string" && productResult.recomendacion.trim().length > 0;
  const decisionFlowValido =
    Array.isArray(productResult.decisionFlow) &&
    productResult.decisionFlow.length >= 1 &&
    productResult.decisionFlow.length <= 10 &&
    productResult.decisionFlow.every((step) => typeof step === "string" && step.trim().length > 0);
  const actionPlanValido =
    typeof productResult.actionPlan === "string" && productResult.actionPlan.trim().length > 0;
  const externalConstraintValido =
    productResult.externalConstraintDetected === null ||
    (typeof productResult.externalConstraintDetected === "object" &&
      productResult.externalConstraintDetected !== null &&
      productResult.externalConstraintDetected.type === "manual_required" &&
      typeof productResult.externalConstraintDetected.message === "string" &&
      productResult.externalConstraintDetected.action === "pause_analysis");

  const ok =
    hasOnlyAllowedKeys &&
    hasNoUnexpectedKeys &&
    paisValido &&
    riesgoValido &&
    estadoValido &&
    recomendacionValida &&
    decisionFlowValido &&
    actionPlanValido &&
    externalConstraintValido;

  if (ok) return result;

  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error("[runMultaCheck] release-readiness-failed", {
      hasOnlyAllowedKeys,
      hasNoUnexpectedKeys,
      paisValido,
      riesgoValido,
      estadoValido,
      recomendacionValida,
      decisionFlowValido,
      actionPlanValido,
      externalConstraintValido,
    });
  }

  return buildSafeFallbackOutput();
}

function simulationHooksLog(result: AnalysisResult) {
  if (!ENV.enableMockSimulation) return;
  // Hook no intrusivo para telemetría/simulación futura.
  if (typeof console !== "undefined" && typeof console.debug === "function") {
    console.debug("[runMultaCheck] simulation-hook", {
      pais: result.pais,
      riesgo: result.riesgo,
      estado: result.estado,
    });
  }
}

function createSafeErrorContext(
  role: UserRole,
  legalContext: ProductLegalContext,
  patentMasked: string
) {
  return {
    role,
    pais: legalContext.pais,
    ruleset: legalContext.ruleset,
    patenteMasked: patentMasked,
  };
}

function reportError(
  role: UserRole,
  error: AnalysisError
) {
  registerAnalysisError(error);
  const shouldLog =
    ENV.enableObservabilityLogs ||
    error.severity === "critical" ||
    error.severity === "high";
  if (!shouldLog) return;
  logAnalysisError({
    timestamp: new Date().toISOString(),
    role,
    error,
  });
}

export function normalizeProductOutput(result: AnalysisResult): ProductOutput {
  return {
    pais: result.pais,
    riesgo: result.riesgo,
    estado: result.estado,
    recomendacion: result.recomendacion,
    decisionFlow: result.decisionFlow,
    actionPlan: Array.isArray(result.actionPlan) ? result.actionPlan.join(" ") : "",
    externalConstraintDetected: result.externalConstraintDetected,
  };
}

export function sanitizeProductOutput(
  result: ProductOutput,
  options: { maxDecisionSteps?: number } = {}
): ProductOutput {
  const maxDecisionSteps = options.maxDecisionSteps ?? 3;
  const pais = typeof result.pais === "string" && result.pais.trim() ? result.pais : "AR";
  const riesgo =
    result.riesgo === "alto" || result.riesgo === "medio" || result.riesgo === "bajo"
      ? result.riesgo
      : "medio";
  const estado =
    result.estado === "critico" || result.estado === "revisable" || result.estado === "impugnable"
      ? result.estado
      : "revisable";
  const recomendacion =
    typeof result.recomendacion === "string" && result.recomendacion.trim().length > 0
      ? result.recomendacion.trim()
      : "Recomendación: revisar antecedentes y continuar con validación administrativa.";
  const decisionFlow = Array.isArray(result.decisionFlow)
    ? result.decisionFlow
        .filter((step) => typeof step === "string" && step.trim().length > 0)
        .slice(0, Math.max(1, maxDecisionSteps))
    : [];
  const actionPlan =
    typeof result.actionPlan === "string" && result.actionPlan.trim().length > 0
      ? result.actionPlan.trim()
      : "Validar documentación, definir acción administrativa y ejecutar dentro de plazo.";
  const externalConstraintDetected =
    result.externalConstraintDetected &&
    typeof result.externalConstraintDetected === "object"
      ? result.externalConstraintDetected
      : null;

  return {
    pais,
    riesgo,
    estado,
    recomendacion,
    decisionFlow,
    actionPlan,
    externalConstraintDetected,
  };
}

export function filterByRole(
  result: ProductOutput,
  role: UserRole,
  internal: { executionTime: number; engineVersion: string; releaseReady: boolean }
): ProductOutput {
  void role;
  void internal;
  return result;
}

function validateInput(
  patente: string,
  legalContext: ProductLegalContext
): { patente: string; legalContext: ProductLegalContext } {
  const cleanedPatente = String(patente ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const safeContext: ProductLegalContext = {
    ...legalContext,
    role:
      legalContext?.role === "enterprise" || legalContext?.role === "admin"
        ? legalContext.role
        : "public",
    pais: String(legalContext?.pais ?? "AR"),
    ruleset: String(legalContext?.ruleset ?? "AR"),
    intentionProfile: String(
      legalContext?.intentionProfile ?? "administrative_defense_oriented"
    ),
    vocabularyProfile: String(
      legalContext?.vocabularyProfile ?? "argentina_legal_spanish"
    ),
    notificationStatus:
      legalContext?.notificationStatus === "notified" ||
      legalContext?.notificationStatus === "notified_formal" ||
      legalContext?.notificationStatus === "not_notified"
        ? legalContext.notificationStatus
        : null,
  };

  return {
    patente: cleanedPatente,
    legalContext: safeContext,
  };
}

export function runMultaCheck(
  patente: string,
  provinciaSeleccionada: string | null,
  legalContext: ProductLegalContext
): ProductResult {
  const startedAt = Date.now();
  const patenteMasked = maskPatente(patente);
  const engineVersion = ENGINE_CONTRACT.version;

  const role: UserRole = legalContext.role ?? "public";
  const safeErrorContext = createSafeErrorContext(role, legalContext, patenteMasked);

  let releaseResult: ProductOutput;
  const input = validateInput(patente, legalContext);
  const engineInput: AnalysisEngineInput = {
    patente: input.patente,
    provinciaSeleccionada,
    legalContext: input.legalContext,
  };

  try {
    let rawResult: AnalysisResult;
    try {
      rawResult = ENGINE_CONTRACT.execute(engineInput);
    } catch (error) {
      const wrapped = classifyAnalysisError({
        stage: "engine",
        message: error instanceof Error ? error.message : "Engine crash",
        context: safeErrorContext,
      });
      reportError(role, wrapped);
      throw error;
    }

    let validatedResult: AnalysisResult = rawResult;
    try {
      validatedResult = validateAnalysisResult(rawResult);
    } catch (error) {
      const wrapped = classifyAnalysisError({
        stage: "validation",
        message: error instanceof Error ? error.message : "Invalid AnalysisResult",
        context: safeErrorContext,
      });
      reportError(role, wrapped);
      if (ENV.enableStrictValidation) {
        throw error;
      }
    }

    if (
      validatedResult.riesgo === "alto" &&
      validatedResult.estado !== "critico"
    ) {
      reportError(
        role,
        classifyAnalysisError({
          stage: "consistency",
          message: "Inconsistencia riesgo/estado detectada y tolerada.",
          context: safeErrorContext,
        })
      );
    }

    simulationHooksLog(validatedResult);
    const normalizedResult = normalizeProductOutput(validatedResult);

    let sanitizedResult: ProductOutput;
    try {
      sanitizedResult = sanitizeProductOutput(
        normalizedResult,
        role === "public" ? { maxDecisionSteps: 3 } : { maxDecisionSteps: 10 }
      );
    } catch (error) {
      const wrapped = classifyAnalysisError({
        stage: "sanitize",
        message: error instanceof Error ? error.message : "Invalid output structure",
        context: safeErrorContext,
      });
      reportError(role, wrapped);
      sanitizedResult = buildSafeFallbackOutput();
    }

    const durationMs = Date.now() - startedAt;
    const releaseChecked = releaseReadinessCheck(sanitizedResult);
    releaseResult = filterByRole(releaseChecked, role, {
      executionTime: durationMs,
      engineVersion,
      releaseReady: true,
    });
  } catch {
    releaseResult = filterByRole(buildSafeFallbackOutput(), role, {
      executionTime: Date.now() - startedAt,
      engineVersion,
      releaseReady: false,
    });
  }

  const errorReport = getAnalysisErrorReport();
  if ((errorReport.low > 0 || errorReport.medium > 0) && ENV.enableObservabilityLogs) {
    reportError(
      role,
      classifyAnalysisError({
        stage: "quality",
        message: "Quality warnings detected during runMultaCheck execution.",
        context: {
          ...safeErrorContext,
          lowWarnings: errorReport.low,
          mediumWarnings: errorReport.medium,
        },
      })
    );
  }

  const output = releaseResult;
  const durationMs = Date.now() - startedAt;

  if (role === "admin" && ENV.enableObservabilityLogs) {
    logAnalysisExecution({
      phase: "end",
      timestamp: new Date().toISOString(),
      durationMs,
      engineVersion,
      success: true,
      input: {
        patenteMasked,
        pais: legalContext.pais,
        intentionProfile: legalContext.intentionProfile,
      },
      output: {
        riesgo: output.riesgo,
        estado: output.estado,
        hasExternalConstraint: output.externalConstraintDetected !== null,
      },
    });
  }

  return output;
}

