/**
 * Informe de defensa administrativa — plantilla determinística (sin llamadas externas).
 * Los valores del semáforo se normalizan acá solo para el texto del informe.
 */

const LIGHT = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

/** @returns {"GREEN"|"YELLOW"|"RED"} */
export function normalizeTrafficLightForReport(value) {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (v === LIGHT.GREEN || v === LIGHT.YELLOW || v === LIGHT.RED) {
    return v;
  }
  return LIGHT.YELLOW;
}

function sanitizeParagraph(text, maxLen) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function classificationExplanation(light) {
  switch (light) {
    case LIGHT.GREEN:
      return [
        "Los indicadores asociados a este expediente sugieren que explorar una impugnación administrativa puede ser un camino razonable,",
        "siempre sujeto a los plazos aplicables, a las normas de la jurisdicción y a la completitud del legajo probatorio.",
        "Esta valoración es probabilística; no anticipa cómo resolverá la autoridad competente.",
      ].join(" ");
    case LIGHT.YELLOW:
      return [
        "Los indicadores muestran incertidumbre jurídica relevante: hechos, requisitos formales o aspectos procesales pueden encontrarse abiertos",
        "y afectar materialmente el resultado cuando el expediente se examine en profundidad.",
        "Esta apreciación es orientativa y no reemplaza el análisis de fuentes primarias ni de la normativa local.",
      ].join(" ");
    case LIGHT.RED:
    default:
      return [
        "Los indicadores sugieren una probabilidad comparativamente alta de que la actuación fiscalizadora sea considerada válida en sustancia y en forma",
        "según estándares administrativos ordinarios, salvo circunstancias documentales o procesales excepcionales.",
        "No constituye una predicción de resultado; la autoridad conserva margen de decisión y los casos pueden variar.",
      ].join(" ");
  }
}

function riskBullets(light, multa) {
  const typeLabel =
    sanitizeParagraph(multa.type ?? "infracción de tránsito", 120) ||
    "infracción de tránsito";
  const jurisdiccion =
    sanitizeParagraph(multa.country ?? "la jurisdicción indicada", 80) ||
    "la jurisdicción indicada";
  const base = [
    `La categoría de la presunta infracción (${typeLabel}) suele encuadrar los plazos, las defensas admisibles y las cargas probatorias típicas en ${jurisdiccion}.`,
  ];
  switch (light) {
    case LIGHT.GREEN:
      return [
        ...base,
        "En expedientes comparables a veces aparecen irregularidades formales o sustanciales; si aplican aquí depende del legajo completo y de las normas vigentes.",
        "Los tiempos procesales (notificaciones, emplazamientos y ventanas de recurso o impugnación) pueden condicionar fuertemente los remedios disponibles.",
        "Incluso cuando existan fundamentos, la autoridad puede ponderar políticas públicas, proporcionalidad y fuerza probatoria.",
      ];
    case LIGHT.YELLOW:
      return [
        ...base,
        "Los hechos centrales pueden seguir discutidos o incompletos hasta presentar documentación adicional o aclarar el expediente ante la autoridad.",
        "La decisión entre una salida negociada y un planteo formal suele depender de tolerancia al riesgo y de costos razonables.",
        "La sensibilidad del resultado aumenta cuando la normativa otorga discreción o cuando se espera evidencia mixta.",
      ];
    case LIGHT.RED:
    default:
      return [
        ...base,
        "Cuando predominan indicadores de validez, la regularización voluntaria dentro de los plazos legales puede reducir multas, intereses o costos accesorios cuando el régimen lo permite.",
        "En principio puede contemplarse un planteo formal, pero conviene ponderar el beneficio marginal esperado frente a tiempo y gasto.",
        "Cualquier duda residual debería revisarse con asesoramiento profesional con acceso al expediente íntegro.",
      ];
  }
}

function suggestedAction(light) {
  switch (light) {
    case LIGHT.GREEN:
      return [
        "Orientación sugerida: priorizar evaluar una impugnación administrativa formal, previa confirmación de plazos no dispensables y de la prueba admisible según las reglas locales.",
        "Cuando corresponda, puede contemplarse en paralelo una aclaración negociada con la autoridad; eso no sustituye el análisis de viabilidad del planteo.",
      ].join("\n\n");
    case LIGHT.YELLOW:
      return [
        "Orientación sugerida: obtener u ordenar la documentación faltante y recién después definir entre (i) una salida consensuada con la administración y (ii) un planteo formal, según cómo se consoliden los hechos.",
        "Avanzar por etapas; evitar decisiones procesales irreversibles mientras subsistan incertidumbres materiales.",
      ].join("\n\n");
    case LIGHT.RED:
    default:
      return [
        "Orientación sugerida: si resulta proporcionado según las normas aplicables, el pago o la regularización voluntaria dentro de los plazos legales suele ser relativamente eficiente.",
        "Si se evalúa un planteo, conviene fundarlo de manera acotada en irregularidades documentadas o circunstancias excepcionales, con expectativas realistas sobre el estándar de revisión.",
      ].join("\n\n");
  }
}

function summaryOfCase(multa) {
  const country = sanitizeParagraph(multa.country ?? "", 80) || "sin especificar";
  const type = sanitizeParagraph(multa.type ?? "", 120) || "sin especificar";
  const raw = multa.rawInput ?? multa.description ?? "";
  const detail = sanitizeParagraph(raw, 900);

  if (detail.length > 0) {
    return [
      `El expediente refiere una presunta infracción tipo «${type}» en ${country}.`,
      `La narrativa aportada por el usuario, en sustancia, es la siguiente: ${detail}`,
      "Este resumen es meramente descriptivo y puede requerir corroboración en cualquier trámite formal.",
    ].join(" ");
  }
  return [
    `El expediente refiere una presunta infracción tipo «${type}» en ${country}.`,
    "La información fáctica disponible al momento de generar el informe es acotada; conviene actualizar la estrategia cuando se reúnan actuaciones y notificaciones primarias.",
  ].join(" ");
}

function disclaimer() {
  return [
    "Aviso legal",
    "",
    "Este informe tiene carácter informativo y educativo. No constituye asesoramiento jurídico ni genera relación abogado-cliente",
    "y no debe interpretarse como garantía, predicción ni aseguramiento de un resultado administrativo o judicial determinado.",
    "Las leyes, reglamentos y prácticas administrativas cambian y varían según jurisdicción; conviene que un profesional matriculado revise el expediente completo antes de decidir.",
    "MultaCheck brinda orientación probabilística; la decisión definitiva corresponde a la autoridad competente.",
  ].join(" ");
}

/**
 * Arma el cuerpo persistido del informe de descargo (texto plano).
 * La estructura y el orden de secciones son invariantes.
 *
 * @param {import("@prisma/client").Multa | Record<string, unknown>} multa
 */
export function buildDischargeText(multa) {
  if (!multa || typeof multa.id !== "string" || !multa.id) {
    throw new Error("buildDischargeText: invalid multa record");
  }

  const light = normalizeTrafficLightForReport(multa.trafficLight);
  const country = sanitizeParagraph(multa.country ?? "", 80) || "—";

  const sections = [
    "Informe de defensa administrativa",
    "",
    "Encabezado",
    `Título: Informe de defensa administrativa`,
    `ID de expediente MultaCheck: ${multa.id}`,
    `País / jurisdicción: ${country}`,
    "",
    "Resumen del caso",
    summaryOfCase(multa),
    "",
    "Clasificación jurídica orientativa",
    `Semáforo orientativo: ${light}`,
    classificationExplanation(light),
    "",
    "Evaluación de riesgos",
    ...riskBullets(light, multa).map((b) => `• ${b}`),
    "",
    "Orientación sugerida",
    suggestedAction(light),
    "",
    disclaimer(),
  ];

  return sections.join("\n");
}
