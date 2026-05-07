/** Copy compartido: diagnóstico → pago → reporte (sin lógica de negocio). */

export const REPORT_TITLE = "Your Legal Defense Report";
export const REPORT_SUBTITLE =
  "Structured legal analysis of your traffic fine case";

export const REPORT_VALUE_BULLETS = [
  "Case classification",
  "Legal risk summary",
  "Recommended action",
];

/** Una frase corta por semáforo (disparador alineado con decisión y reporte). */
export const SEMAPHORE_IMPACT = {
  GREEN:
    "Clear opportunity to challenge—use the window before it closes.",
  YELLOW: "Outcome still open—know your risk before you pay.",
  RED: "High chance the fine sticks—lock in your written defense now.",
};

export const FUNNEL_STEP = {
  diagnosis: "Diagnosis",
  decision: "Decision",
  result: "Result",
};

/** Alineado con diagnóstico + bullets del paso de pago (sin contradecir el semáforo). */
export const REPORT_READY_INTRO =
  "Same case you diagnosed—now the full document: classification, legal risk, and recommended action, aligned with the signal from your diagnosis.";
