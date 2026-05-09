export type ExternalConstraintDetected = null | {
  type: "manual_required";
  message: string;
  action: "pause_analysis";
};

export function validateExternalConstraintAR(
  patente: string
): ExternalConstraintDetected {
  const normalizedPatente = (patente ?? "").trim().toUpperCase();
  const isIncomplete = normalizedPatente.length < 6;
  const hasInvalidChars = !/^[A-Z0-9]+$/.test(normalizedPatente);

  if (isIncomplete || hasInvalidChars) {
    return {
      type: "manual_required",
      message: "Patente inválida o incompleta: requiere validación manual.",
      action: "pause_analysis",
    };
  }

  return null;
}
