import { runMultaCheck, type ProductResult } from "../runMultaCheck";
import type { LegalContext } from "../analysisEngine";

type SupportedPais = "AR" | "CL" | "ES" | "CO" | "UY";
type TipoInfraccion = "velocidad" | "estacionamiento" | "documentacion";
type Severidad = "baja" | "media" | "alta";

type MockMulta = {
  pais: SupportedPais;
  patente: string;
  tipoInfraccion: TipoInfraccion;
  severidad: Severidad;
  provinciaSeleccionada: string | null;
  legalContext: LegalContext;
};

type SimulationEntry = {
  input: MockMulta;
  result: ProductResult;
};

/**
 * CORE STABLE - DO NOT MODIFY WITHOUT VERSIONING
 * Contrato de reporte de simulación.
 */
export type SimulationReport = Readonly<{
  totalCasosSimulados: number;
  porcentajeValidez: number;
  inconsistenciasDetectadas: string[];
  distribucionRiesgoPorPais: Record<
    string,
    { bajo: number; medio: number; alto: number }
  >;
  fallosCoherenciaRiesgoEstado: number;
  fallosActionPlanODecisionFlow: number;
  scoringStabilityByPais: Record<string, { uniqueValues: number; stable: boolean }>;
}>;

const INTENTION_BY_PAIS: Record<SupportedPais, string> = {
  AR: "administrative_defense_oriented",
  CL: "procedural_formal_appeal_oriented",
  ES: "sanction_procedure_oriented",
  CO: "traffic_violation_validation_oriented",
  UY: "simplified_administrative_review",
};

const VOCAB_BY_PAIS: Record<SupportedPais, string> = {
  AR: "argentina_legal_spanish",
  CL: "chile_legal_spanish",
  ES: "spain_legal_spanish",
  CO: "colombia_legal_spanish",
  UY: "uruguay_legal_spanish",
};

const PROVINCIA_BY_PAIS: Record<SupportedPais, string | null> = {
  AR: "CABA",
  CL: "Santiago",
  ES: "Madrid",
  CO: "Bogotá",
  UY: "Montevideo",
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)];
}

function generatePatenteAleatoria() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const l = () => letters[randInt(0, letters.length - 1)];
  const d = () => digits[randInt(0, digits.length - 1)];
  // Formato válido simple tipo: AA123BB
  return `${l()}${l()}${d()}${d()}${d()}${l()}${l()}`;
}

export function generateMockMulta(pais: string): MockMulta {
  const safePais: SupportedPais =
    pais === "AR" || pais === "CL" || pais === "ES" || pais === "CO" || pais === "UY"
      ? pais
      : "AR";

  const tipoInfraccion = randomFrom<TipoInfraccion>([
    "velocidad",
    "estacionamiento",
    "documentacion",
  ]);
  const severidad = randomFrom<Severidad>(["baja", "media", "alta"]);

  return {
    pais: safePais,
    patente: generatePatenteAleatoria(),
    tipoInfraccion,
    severidad,
    provinciaSeleccionada: PROVINCIA_BY_PAIS[safePais],
    legalContext: {
      role: "enterprise",
      pais: safePais,
      ruleset: safePais,
      intentionProfile: INTENTION_BY_PAIS[safePais],
      vocabularyProfile: VOCAB_BY_PAIS[safePais],
      notificationStatus: null,
    },
  };
}

function validateResultShape(result: ProductResult) {
  if (!result.pais || !result.recomendacion) return false;
  if (!Array.isArray(result.decisionFlow) || result.decisionFlow.length === 0) return false;
  if (typeof result.actionPlan !== "string" || result.actionPlan.length === 0) return false;
  return true;
}

function validateRiesgoEstado(result: ProductResult) {
  const expected =
    result.riesgo === "alto"
      ? "critico"
      : result.riesgo === "medio"
      ? "revisable"
      : "impugnable";
  return result.estado === expected;
}

export function generateSimulationReport(
  results: ProductResult[]
): SimulationReport {
  const inconsistenciasDetectadas: string[] = [];
  const distribucionRiesgoPorPais: Record<
    string,
    { bajo: number; medio: number; alto: number }
  > = {};

  let validCount = 0;
  let fallosCoherenciaRiesgoEstado = 0;
  let fallosActionPlanODecisionFlow = 0;

  results.forEach((result, index) => {
    const pais = result.pais || "AR";
    if (!distribucionRiesgoPorPais[pais]) {
      distribucionRiesgoPorPais[pais] = { bajo: 0, medio: 0, alto: 0 };
    }
    distribucionRiesgoPorPais[pais][result.riesgo] += 1;

    const shapeOk = validateResultShape(result);
    const coherenceOk = validateRiesgoEstado(result);
    const flowOk =
      typeof result.actionPlan === "string" &&
      result.actionPlan.length > 0 &&
      Array.isArray(result.decisionFlow) &&
      result.decisionFlow.length > 0;

    if (shapeOk) {
      validCount += 1;
    } else {
      inconsistenciasDetectadas.push(
        `[case-${index}] AnalysisResult inválido o incompleto`
      );
    }

    if (!coherenceOk) {
      fallosCoherenciaRiesgoEstado += 1;
      inconsistenciasDetectadas.push(
        `[case-${index}] Incoherencia riesgo ↔ estado`
      );
    }

    if (!flowOk) {
      fallosActionPlanODecisionFlow += 1;
      inconsistenciasDetectadas.push(
        `[case-${index}] actionPlan/decisionFlow ausente o vacío`
      );
    }
  });

  const scoringStabilityByPais: Record<string, { uniqueValues: number; stable: boolean }> = {};

  const totalCasosSimulados = results.length;
  const porcentajeValidez =
    totalCasosSimulados === 0
      ? 0
      : Number(((validCount / totalCasosSimulados) * 100).toFixed(2));

  return {
    totalCasosSimulados,
    porcentajeValidez,
    inconsistenciasDetectadas,
    distribucionRiesgoPorPais,
    fallosCoherenciaRiesgoEstado,
    fallosActionPlanODecisionFlow,
    scoringStabilityByPais,
  };
}

export function runSimulationSuite() {
  const paises: SupportedPais[] = ["AR", "CL", "ES", "CO", "UY"];
  const runsPerPais = 12;
  const outputs: SimulationEntry[] = [];

  for (const pais of paises) {
    for (let i = 0; i < runsPerPais; i += 1) {
      const input = generateMockMulta(pais);
      const result = runMultaCheck(
        input.patente,
        input.provinciaSeleccionada,
        input.legalContext
      );

      outputs.push({ input, result });
    }
  }

  const results = outputs.map((entry) => entry.result);
  const report = generateSimulationReport(results);

  return {
    results,
    report,
  };
}

