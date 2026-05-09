import type { AnalysisResult, LegalContext } from "../analysisEngine";

type RiesgoNivel = "bajo" | "medio" | "alto";
type EstadoLegal = "impugnable" | "revisable" | "critico";

type InfraccionAR = Readonly<{
  tipo: "velocidad_excesiva" | "estacionamiento_indebido" | "documentacion_faltante";
  velocidadKmh?: number;
  limiteKmh?: number;
  zona?: "estandar" | "sensible";
  documentacionCompleta?: boolean;
}>;

type ContextoAR = Readonly<{
  patente: string;
  provinciaSeleccionada: string | null;
  legalContext?: LegalContext;
  intentionProfile?: string;
  notificationStatus?: "notified" | "notified_formal" | "not_notified" | null;
}>;

function stableScore(seed: string): number {
  return seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function parseZona(provinciaSeleccionada: string | null): "estandar" | "sensible" {
  const provincia = String(provinciaSeleccionada ?? "").toLowerCase();
  return provincia.includes("caba") || provincia.includes("centro") ? "sensible" : "estandar";
}

function detectExternalConstraint(patente: string) {
  const normalizedPatente = (patente ?? "").trim().toUpperCase();
  const isIncomplete = normalizedPatente.length < 6;
  const hasInvalidChars = !/^[A-Z0-9]+$/.test(normalizedPatente);

  if (isIncomplete || hasInvalidChars) {
    return {
      type: "manual_required" as const,
      message: "Patente inválida o incompleta: requiere validación manual.",
      action: "pause_analysis" as const,
    };
  }

  return null;
}

function buildActionPlan(estado: EstadoLegal, notificationStatus?: ContextoAR["notificationStatus"]) {
  const base =
    estado === "critico"
      ? [
          "Reunir acta, pruebas y constancias administrativas relevantes.",
          "Preparar presentación de descargo con fundamentos normativos.",
          "Ingresar la impugnación dentro del plazo vigente.",
        ]
      : estado === "revisable"
      ? [
          "Validar consistencia del acta y evidencia disponible.",
          "Definir si corresponde revisión administrativa o descargo.",
          "Documentar la estrategia y próximos vencimientos.",
        ]
      : [
          "Conservar respaldo documental y comprobantes asociados.",
          "Monitorear vencimientos y notificaciones oficiales.",
          "Impugnar solo ante inconsistencia formal comprobable.",
        ];

  if (notificationStatus === "notified_formal") {
    return ["Priorizar plazos por notificación oficial confirmada.", ...base];
  }
  if (notificationStatus === "not_notified") {
    return ["Confirmar validez de notificación antes de cualquier presentación.", ...base];
  }
  return base;
}

function buildDecisionFlow(estado: EstadoLegal) {
  return estado === "critico"
    ? [
        "Paso 1: Reuní toda la documentación respaldatoria.",
        "Paso 2: Definí estrategia de descargo administrativo.",
        "Paso 3: Presentá dentro de plazo y guardá constancia.",
      ]
    : estado === "revisable"
    ? [
        "Paso 1: Revisá acta y evidencia para detectar vicios.",
        "Paso 2: Evaluá revisión administrativa frente a pago.",
        "Paso 3: Prepará documentación para la opción elegida.",
      ]
    : [
        "Paso 1: Confirmá datos básicos y vigencia de la multa.",
        "Paso 2: Conservá respaldo documental preventivo.",
        "Paso 3: Escalá solo si detectás irregularidades.",
      ];
}

export const AR_Ruleset = {
  interpretarInfraccion(infraccion: unknown, contexto: ContextoAR): InfraccionAR {
    if (infraccion && typeof infraccion === "object" && "tipo" in (infraccion as Record<string, unknown>)) {
      return infraccion as InfraccionAR;
    }

    const seed = stableScore(
      `${contexto.patente}|${contexto.provinciaSeleccionada ?? "NACIONAL"}|AR`
    );
    const selector = seed % 3;

    if (selector === 0) {
      const limiteKmh = 60;
      const exceso = seed % 4 === 0 ? 35 : 18;
      return {
        tipo: "velocidad_excesiva",
        limiteKmh,
        velocidadKmh: limiteKmh + exceso,
      };
    }

    if (selector === 1) {
      return {
        tipo: "estacionamiento_indebido",
        zona: parseZona(contexto.provinciaSeleccionada),
      };
    }

    return {
      tipo: "documentacion_faltante",
      documentacionCompleta: false,
    };
  },

  determinarRiesgo(infraccion: InfraccionAR): RiesgoNivel {
    if (infraccion.tipo === "documentacion_faltante") {
      return "alto";
    }

    if (infraccion.tipo === "velocidad_excesiva") {
      const velocidad = infraccion.velocidadKmh ?? 0;
      const limite = infraccion.limiteKmh ?? 60;
      const exceso = velocidad - limite;
      return exceso >= 25 ? "alto" : "medio";
    }

    if (infraccion.tipo === "estacionamiento_indebido") {
      return infraccion.zona === "sensible" ? "medio" : "bajo";
    }

    return "medio";
  },

  mapearEstadoLegal(riesgo: RiesgoNivel, _infraccion: InfraccionAR): EstadoLegal {
    if (riesgo === "alto") return "critico";
    if (riesgo === "medio") return "revisable";
    return "impugnable";
  },

  generarRecomendacion(estado: EstadoLegal, contexto: ContextoAR): string {
    const base =
      estado === "critico"
        ? "Reunir acta, constancias y antecedentes para presentar descargo administrativo urgente."
        : estado === "revisable"
        ? "Verificar acta y evidencia para definir revisión administrativa con respaldo documental."
        : "Conservar documentación y preparar impugnación simple si detecta inconsistencias formales.";

    if (contexto.notificationStatus === "notified_formal") {
      return `${base} Priorizar control de plazos de notificación oficial.`;
    }
    if (contexto.notificationStatus === "not_notified") {
      return `${base} Confirmar primero la validez de la notificación en sede administrativa.`;
    }
    return base;
  },

  execute(input: Readonly<{
    patente: string;
    provinciaSeleccionada: string | null;
    legalContext?: LegalContext;
  }>): AnalysisResult {
    const contexto: ContextoAR = {
      patente: input.patente,
      provinciaSeleccionada: input.provinciaSeleccionada,
      legalContext: input.legalContext,
      intentionProfile: input.legalContext?.intentionProfile,
      notificationStatus: input.legalContext?.notificationStatus,
    };
    const infraccion = AR_Ruleset.interpretarInfraccion(undefined, contexto);
    const riesgo = AR_Ruleset.determinarRiesgo(infraccion);
    const estado = AR_Ruleset.mapearEstadoLegal(riesgo, infraccion);
    const semilla = `${input.patente}-${input.provinciaSeleccionada ?? "NACIONAL"}-AR`;
    const scoring = stableScore(semilla) % 10;

    return {
      pais: "AR",
      ruleset: "AR",
      riesgo,
      estado,
      scoring,
      recomendacion: AR_Ruleset.generarRecomendacion(estado, contexto),
      decisionFlow: buildDecisionFlow(estado),
      actionPlan: buildActionPlan(estado, contexto.notificationStatus),
      externalConstraintDetected: detectExternalConstraint(input.patente),
    };
  },
} as const;
