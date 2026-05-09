import { AR_Ruleset } from "./rules/AR";
/**
 * CORE STABLE - DO NOT MODIFY WITHOUT VERSIONING
 * Este módulo es parte del núcleo estable de MULTACHECK.
 */

export type LegalContext = Readonly<{
  role: "public" | "enterprise" | "admin";
  pais: string;
  ruleset: string;
  intentionProfile: string;
  vocabularyProfile: string;
  notificationStatus: "notified" | "notified_formal" | "not_notified" | null;
}>;

export type ExternalConstraintDetected = null | {
  type: "manual_required";
  message: string;
  action: "pause_analysis";
};

export type AnalysisResult = Readonly<{
  pais: string;
  ruleset: string;
  riesgo: "bajo" | "medio" | "alto";
  estado: "impugnable" | "revisable" | "critico";
  scoring: number;
  recomendacion: string;
  decisionFlow: string[];
  actionPlan: string[];
  externalConstraintDetected: ExternalConstraintDetected;
}>;

/**
 * CORE STABLE - DO NOT MODIFY WITHOUT VERSIONING
 * Contract-first API del engine. Cambios de firma requieren versión nueva.
 */
export type AnalysisEngineInput = Readonly<{
  patente: string;
  provinciaSeleccionada: string | null;
  legalContext: LegalContext;
}>;

export type AnalysisEngineContract = Readonly<{
  version: "v1";
  execute: (input: AnalysisEngineInput) => AnalysisResult;
}>;

const SUPPORTED_PAISES = new Set(["AR", "CL", "ES", "CO", "UY"]);
const VALID_RIESGOS = new Set(["bajo", "medio", "alto"]);
const VALID_ESTADOS = new Set(["impugnable", "revisable", "critico"]);

function buildSafeActionPlan(
  riesgo: "bajo" | "medio" | "alto",
  estado: "impugnable" | "revisable" | "critico"
) {
  if (riesgo === "alto") {
    return [
      `Estado objetivo: ${estado}.`,
      "Reunir evidencia principal antes de cualquier acción.",
      "Preparar impugnación formal y presentarla dentro de plazo.",
    ];
  }
  if (riesgo === "medio") {
    return [
      `Estado objetivo: ${estado}.`,
      "Revisar documentación y definir si conviene descargo.",
    ];
  }
  return [
    `Estado objetivo: ${estado}.`,
    "Conservar respaldo y monitorear próximos vencimientos.",
  ];
}

function buildSafeDecisionFlow(
  estado: "impugnable" | "revisable" | "critico"
) {
  return [
    `Estado actual: ${estado}.`,
    "Verificar documentación disponible.",
    "Elegir la acción administrativa más conveniente.",
  ];
}

function detectExternalConstraint(patente: string) {
  const normalizedPatente = (patente ?? '').trim().toUpperCase();
  const isIncomplete = normalizedPatente.length < 6;
  const hasInvalidChars = !/^[A-Z0-9]+$/.test(normalizedPatente);

  if (isIncomplete || hasInvalidChars) {
    return {
      type: 'manual_required' as const,
      message: 'Patente inválida o incompleta: requiere validación manual.',
      action: 'pause_analysis' as const,
    };
  }

  return null;
}

function adaptarRecomendacionPorIntencion(
  recomendacionBase: string,
  intentionProfile?: string
) {
  if (!intentionProfile) return recomendacionBase;

  switch (intentionProfile) {
    case "administrative_defense_oriented":
      return `Enfoque de descargo técnico: ${recomendacionBase}`;
    case "procedural_formal_appeal_oriented":
      return `Enfoque procedimental formal: preparar apelación estructurada. ${recomendacionBase}`;
    case "sanction_procedure_oriented":
      return `Enfoque de validación de sanción: verificar legalidad y trazabilidad del acto sancionador.`;
    case "traffic_violation_validation_oriented":
      return `Enfoque de verificación de infracción: contrastar evidencia, tipificación y competencia de la autoridad.`;
    case "simplified_administrative_review":
      return `Enfoque simplificado: ${recomendacionBase}`;
    default:
      return recomendacionBase;
  }
}

function adaptarRecomendacionPorNotificacion(
  recomendacionBase: string,
  notificationStatus?: "notified" | "notified_formal" | "not_notified" | null
) {
  switch (notificationStatus) {
    case "notified_formal":
      return `${recomendacionBase} Prioridad alta: actuar sobre notificación oficial y plazos formales.`;
    case "notified":
      return `${recomendacionBase} Revisar validez de la notificación recibida y fechas clave.`;
    case "not_notified":
      return `${recomendacionBase} Verificar primero existencia de notificación válida antes de avanzar.`;
    default:
      return recomendacionBase;
  }
}

function buildActionPlan(
  riesgo: "bajo" | "medio" | "alto",
  estado: "impugnable" | "revisable" | "critico",
  intentionProfile?: string,
  notificationStatus?: "notified" | "notified_formal" | "not_notified" | null
) {
  const basePlan =
    riesgo === "alto"
      ? [
          "Reunir prueba documental y cronología completa del caso.",
          "Redactar impugnación estructurada con fundamentos normativos.",
          "Presentar descargo en plazo y registrar constancia de recepción.",
        ]
      : riesgo === "medio"
      ? [
          "Verificar consistencia de acta, evidencia y datos del vehículo.",
          "Evaluar costo-beneficio entre pago y descargo técnico.",
          "Preparar borrador de revisión para eventual presentación.",
        ]
      : [
          "Conservar documentación básica por prevención.",
          "Monitorear vencimientos y canales oficiales de consulta.",
          "Escalar a revisión formal solo si aparecen inconsistencias.",
        ];

  const profilePrefix =
    intentionProfile === "administrative_defense_oriented"
      ? "Defensa administrativa:"
      : intentionProfile === "procedural_formal_appeal_oriented"
      ? "Procedimiento formal:"
      : intentionProfile === "sanction_procedure_oriented"
      ? "Validación de sanción:"
      : intentionProfile === "traffic_violation_validation_oriented"
      ? "Verificación de infracción:"
      : intentionProfile === "simplified_administrative_review"
      ? "Revisión simplificada:"
      : null;

  const plan = profilePrefix
    ? basePlan.map((step) => `${profilePrefix} ${step}`)
    : basePlan;

  const notifStep =
    notificationStatus === "notified_formal"
      ? "Notificación oficial: priorizar control de plazos y constancias."
      : notificationStatus === "notified"
      ? "Notificación reportada: validar canal, fecha y contenido."
      : notificationStatus === "not_notified"
      ? "Sin notificación: confirmar estado oficial antes de presentar escrito."
      : null;

  return [`Estado objetivo: ${estado}.`, ...(notifStep ? [notifStep] : []), ...plan];
}

function buildDecisionFlow(
  riesgo: "bajo" | "medio" | "alto",
  estado: "impugnable" | "revisable" | "critico",
  intentionProfile?: string,
  notificationStatus?: "notified" | "notified_formal" | "not_notified" | null
) {
  const baseFlow =
    riesgo === "alto"
      ? [
          "Paso 1: Reuní toda la evidencia disponible antes de actuar.",
          "Paso 2: Definí si vas a impugnar formalmente dentro del plazo vigente.",
          "Paso 3: Presentá el descargo y guardá constancia para seguimiento.",
        ]
      : riesgo === "medio"
      ? [
          "Paso 1: Revisá acta y evidencia para detectar inconsistencias.",
          "Paso 2: Evaluá si conviene pagar o avanzar con revisión formal.",
          "Paso 3: Si hay dudas relevantes, prepará descargo preventivo.",
        ]
      : [
          "Paso 1: Confirmá datos básicos de la multa y vencimientos.",
          "Paso 2: Conservá respaldo documental por prevención.",
          "Paso 3: Actuá solo si aparece una inconsistencia concreta.",
        ];

  const enfoque =
    intentionProfile === "administrative_defense_oriented"
      ? "Enfoque defensa administrativa."
      : intentionProfile === "procedural_formal_appeal_oriented"
      ? "Enfoque procedimiento de apelación."
      : intentionProfile === "sanction_procedure_oriented"
      ? "Enfoque validación de sanción."
      : intentionProfile === "traffic_violation_validation_oriented"
      ? "Enfoque verificación de infracción."
      : intentionProfile === "simplified_administrative_review"
      ? "Enfoque revisión simplificada."
      : "Enfoque general.";

  const notifLine =
    notificationStatus === "notified_formal"
      ? "Estado de notificación: oficial confirmada."
      : notificationStatus === "notified"
      ? "Estado de notificación: recibida (pendiente validar formalidad)."
      : notificationStatus === "not_notified"
      ? "Estado de notificación: no reportada."
      : "Estado de notificación: no confirmado.";

  return [`Estado actual: ${estado}.`, notifLine, enfoque, ...baseFlow];
}

export function validateAnalysisResult(result: AnalysisResult): AnalysisResult {
  const pais = SUPPORTED_PAISES.has(result.pais) ? result.pais : "AR";
  const ruleset =
    result.ruleset && typeof result.ruleset === "string" ? result.ruleset : pais;
  const riesgo = VALID_RIESGOS.has(result.riesgo) ? result.riesgo : "medio";
  const estado = VALID_ESTADOS.has(result.estado) ? result.estado : "revisable";
  const scoring = Number.isFinite(result.scoring) ? result.scoring : 0;
  const recomendacion =
    typeof result.recomendacion === "string" && result.recomendacion.trim().length > 0
      ? result.recomendacion
      : "Recomendación: revisar antecedentes y continuar con validación administrativa.";
  const actionPlan =
    Array.isArray(result.actionPlan) &&
    (riesgo !== "alto" || result.actionPlan.length > 0)
      ? result.actionPlan
      : buildSafeActionPlan(riesgo, estado);
  const decisionFlow =
    Array.isArray(result.decisionFlow) &&
    (estado !== "critico" || result.decisionFlow.length > 0)
      ? result.decisionFlow
      : buildSafeDecisionFlow(estado);

  return {
    ...result,
    pais,
    ruleset,
    riesgo,
    estado,
    scoring,
    recomendacion,
    actionPlan,
    decisionFlow,
  };
}

export function generateResultadoAnalisis(
  patente: string,
  provinciaSeleccionada: string | null,
  legalContext?: LegalContext
): AnalysisResult {
  const paisSeleccionado = legalContext?.pais ?? "AR";
  if (paisSeleccionado === "AR") {
    return validateAnalysisResult(
      AR_Ruleset.execute({
        patente,
        provinciaSeleccionada,
        legalContext,
      })
    );
  }

  const ruleset = legalContext?.ruleset ?? paisSeleccionado;
  const semilla = `${patente}-${provinciaSeleccionada ?? "NACIONAL"}-${paisSeleccionado}`;
  const score = semilla.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10;
  const riesgo: "bajo" | "medio" | "alto" = score >= 7 ? "alto" : score >= 4 ? "medio" : "bajo";
  const estado: "impugnable" | "revisable" | "critico" =
    riesgo === "alto" ? "critico" : riesgo === "medio" ? "revisable" : "impugnable";
  const recomendacion =
    riesgo === "alto"
      ? "Recomendación: iniciar descargo técnico inmediato"
      : riesgo === "medio"
      ? "Revisar evidencia antes de pagar"
      : "Probable multa menor sin impacto legal";
  const recomendacionAjustada = adaptarRecomendacionPorIntencion(
    recomendacion,
    legalContext?.intentionProfile
  );
  const recomendacionFinal = adaptarRecomendacionPorNotificacion(
    recomendacionAjustada,
    legalContext?.notificationStatus
  );
  const actionPlan = buildActionPlan(
    riesgo,
    estado,
    legalContext?.intentionProfile,
    legalContext?.notificationStatus
  );
  const decisionFlow = buildDecisionFlow(
    riesgo,
    estado,
    legalContext?.intentionProfile,
    legalContext?.notificationStatus
  );
  const externalConstraintDetected = detectExternalConstraint(patente);

  const resultado: AnalysisResult = {
    pais: paisSeleccionado,
    ruleset,
    riesgo,
    estado,
    scoring: score,
    recomendacion: recomendacionFinal,
    actionPlan,
    decisionFlow,
    externalConstraintDetected,
  };

  switch (paisSeleccionado) {
    case "CL":
    case "ES":
    case "CO":
    case "UY":
    default:
      return validateAnalysisResult(resultado);
  }
}

/**
 * CORE STABLE - DO NOT MODIFY WITHOUT VERSIONING
 * Engine versionado v1. Cualquier cambio estructural debe crear v2.
 */
export const analysisEngine_v1: AnalysisEngineContract = Object.freeze({
  version: "v1",
  execute: (input: AnalysisEngineInput): AnalysisResult =>
    generateResultadoAnalisis(
      input.patente,
      input.provinciaSeleccionada,
      input.legalContext
    ),
});
