export type AnalysisErrorType =
  | "ENGINE_ERROR"
  | "VALIDATION_ERROR"
  | "CONFIG_ERROR"
  | "QUALITY_WARNING";

export type AnalysisErrorSeverity = "critical" | "high" | "medium" | "low";

export type AnalysisError = Readonly<{
  type: AnalysisErrorType;
  severity: AnalysisErrorSeverity;
  message: string;
  context?: Record<string, unknown>;
}>;

export function classifyAnalysisError(input: {
  stage: "engine" | "validation" | "sanitize" | "consistency" | "quality";
  message: string;
  context?: Record<string, unknown>;
}): AnalysisError {
  const normalizedMessage = (input.message ?? "").toLowerCase();

  if (input.stage === "engine") {
    return {
      type: "ENGINE_ERROR",
      severity: "critical",
      message: input.message,
      context: input.context,
    };
  }

  if (input.stage === "sanitize") {
    return {
      type: "CONFIG_ERROR",
      severity: "critical",
      message: input.message,
      context: input.context,
    };
  }

  if (input.stage === "validation") {
    if (
      normalizedMessage.includes("missing required") ||
      normalizedMessage.includes("invalid output structure")
    ) {
      return {
        type: "VALIDATION_ERROR",
        severity: "high",
        message: input.message,
        context: input.context,
      };
    }

    return {
      type: "VALIDATION_ERROR",
      severity: "medium",
      message: input.message,
      context: input.context,
    };
  }

  if (input.stage === "consistency") {
    return {
      type: "VALIDATION_ERROR",
      severity: "medium",
      message: input.message,
      context: input.context,
    };
  }

  return {
    type: "QUALITY_WARNING",
    severity: "low",
    message: input.message,
    context: input.context,
  };
}

const errorBuffer: AnalysisError[] = [];

export function registerAnalysisError(error: AnalysisError): void {
  errorBuffer.push(error);
  if (errorBuffer.length > 200) {
    errorBuffer.shift();
  }
}

export function getAnalysisErrorReport(): Readonly<{
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  errors: ReadonlyArray<AnalysisError>;
}> {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: errorBuffer.length,
  };

  for (const err of errorBuffer) {
    summary[err.severity] += 1;
  }

  return {
    ...summary,
    errors: [...errorBuffer],
  };
}

export function clearAnalysisErrorReport(): void {
  errorBuffer.length = 0;
}
