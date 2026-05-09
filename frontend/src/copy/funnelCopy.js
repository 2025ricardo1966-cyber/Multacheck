/** Copy compartido: diagnóstico → pago → reporte (sin lógica de negocio). Enfoque Argentina / español rioplatense. */

export const REPORT_TITLE = "Tu informe de defensa administrativa";
export const REPORT_SUBTITLE =
  "Análisis orientativo de tu caso de infracción de tránsito";

export const REPORT_VALUE_BULLETS = [
  "Clasificación orientativa del caso",
  "Resumen de riesgos",
  "Orientación sugerida",
];

/** Mensajes de impacto alineados al semáforo (sin garantías de resultado). */
export const SEMAPHORE_IMPACT = {
  GREEN:
    "Hay margen para evaluar impugnación o recurso administrativo: revisá plazos y documentación.",
  YELLOW:
    "El resultado sigue abierto: conviene dimensionar riesgos antes de pagar o impugnar.",
  RED:
    "Los indicadores apuntan a mayor probabilidad de validez del acto administrativo; igualmente conviene revisar el expediente.",
};

export const FUNNEL_STEP = {
  diagnosis: "Diagnóstico",
  decision: "Decisión",
  result: "Resultado",
};

/** Alineado con diagnóstico + bullets del paso de pago (sin contradecir el semáforo). */
export const REPORT_READY_INTRO =
  "Mismo caso que diagnosticaste: acá tenés el texto completo con clasificación orientativa, evaluación de riesgos y orientación sugerida, alineada con el semáforo del diagnóstico.";
