import type { AnalysisError } from "./errors/analysisError";

type ObservabilityEvent = Readonly<{
  phase: "start" | "end";
  timestamp: string;
  durationMs?: number;
  engineVersion?: string;
  success?: boolean;
  input: {
    patenteMasked: string;
    pais: string;
    intentionProfile: string;
  };
  output?: {
    riesgo: "bajo" | "medio" | "alto";
    estado: "impugnable" | "revisable" | "critico";
    hasExternalConstraint: boolean;
  };
}>;

type ObservabilityErrorEvent = Readonly<{
  timestamp: string;
  role?: "public" | "enterprise" | "admin";
  error: AnalysisError;
}>;

function maskPatente(patente: string): string {
  const raw = (patente ?? "").trim().toUpperCase();
  if (!raw) return "***";
  const visible = raw.slice(-3);
  return `***${visible}`;
}

export function logAnalysisExecution(event: ObservabilityEvent): void {
  // Logging estructurado, listo para enrutar a servicio externo más adelante.
  if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log("[multacheck-observability]", JSON.stringify(event));
  }
}

export function logAnalysisError(event: ObservabilityErrorEvent): void {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    const safeContext = event.error.context
      ? {
          ...event.error.context,
          patenteMasked: undefined,
          patente: undefined,
        }
      : undefined;
    console.warn(
      "[multacheck-observability-error]",
      JSON.stringify({
        timestamp: event.timestamp,
        role: event.role,
        error: {
          ...event.error,
          context: safeContext,
        },
      })
    );
  }
}

export { maskPatente };
