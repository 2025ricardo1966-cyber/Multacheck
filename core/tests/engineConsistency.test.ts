import { runMultaCheck, type ProductResult } from "../runMultaCheck";

type LegalContext = {
  role: "public" | "enterprise" | "admin";
  pais: string;
  ruleset: string;
  intentionProfile: string;
  vocabularyProfile: string;
  notificationStatus: "notified" | "notified_formal" | "not_notified" | null;
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertAnalysisResultShape(result: ProductResult, label: string) {
  assert(typeof result.pais === "string" && result.pais.length > 0, `${label}: pais missing`);
  assert(["bajo", "medio", "alto"].includes(result.riesgo), `${label}: invalid riesgo`);
  assert(
    ["impugnable", "revisable", "critico"].includes(result.estado),
    `${label}: invalid estado`
  );
  assert(typeof result.recomendacion === "string", `${label}: recomendacion missing`);
  assert(Array.isArray(result.decisionFlow), `${label}: decisionFlow missing`);
  assert(typeof result.actionPlan === "string", `${label}: actionPlan missing`);
  assert("externalConstraintDetected" in result, `${label}: externalConstraintDetected missing`);
}

function assertRiesgoEstadoCoherence(result: ProductResult, label: string) {
  const expectedEstado =
    result.riesgo === "alto"
      ? "critico"
      : result.riesgo === "medio"
      ? "revisable"
      : "impugnable";
  assert(result.estado === expectedEstado, `${label}: incoherent riesgo/estado`);
}

function assertActionPlanConsistency(result: ProductResult, label: string) {
  if (result.riesgo === "alto") {
    assert(result.actionPlan.length > 0, `${label}: actionPlan must exist for riesgo alto`);
  }
}

export function runEngineConsistencyTests() {
  const baseInput = {
    patente: "AA123BB",
    provinciaSeleccionada: "CABA" as string | null,
  };

  const ctxAR: LegalContext = {
    role: "public",
    pais: "AR",
    ruleset: "AR",
    intentionProfile: "administrative_defense_oriented",
    vocabularyProfile: "argentina_legal_spanish",
    notificationStatus: null,
  };
  const ctxCL: LegalContext = {
    role: "public",
    pais: "CL",
    ruleset: "CL",
    intentionProfile: "procedural_formal_appeal_oriented",
    vocabularyProfile: "chile_legal_spanish",
    notificationStatus: null,
  };
  const ctxES: LegalContext = {
    role: "public",
    pais: "ES",
    ruleset: "ES",
    intentionProfile: "sanction_procedure_oriented",
    vocabularyProfile: "spain_legal_spanish",
    notificationStatus: null,
  };

  // Caso 1: misma patente + mismo país => consistencia lógica del resultado
  const r1 = runMultaCheck(
    baseInput.patente,
    baseInput.provinciaSeleccionada,
    ctxAR
  );
  const r2 = runMultaCheck(
    baseInput.patente,
    baseInput.provinciaSeleccionada,
    ctxAR
  );
  assert(r1.riesgo === r2.riesgo, "same input/country: riesgo mismatch");
  assert(r1.estado === r2.estado, "same input/country: estado mismatch");

  // Caso 2: AR vs CL vs ES con misma entrada:
  // scoring base debe mantenerse estable y cambiar enfoque guía.
  const rAR = runMultaCheck(
    baseInput.patente,
    baseInput.provinciaSeleccionada,
    ctxAR
  );
  const rCL = runMultaCheck(
    baseInput.patente,
    baseInput.provinciaSeleccionada,
    ctxCL
  );
  const rES = runMultaCheck(
    baseInput.patente,
    baseInput.provinciaSeleccionada,
    ctxES
  );

  // Deben diferir por capa de guía al cambiar intentionProfile
  assert(
    rAR.recomendacion !== rCL.recomendacion || rAR.recomendacion !== rES.recomendacion,
    "cross-country consistency: recommendation did not adapt by context"
  );
  assert(
    JSON.stringify(rAR.decisionFlow) !== JSON.stringify(rCL.decisionFlow) ||
      JSON.stringify(rAR.decisionFlow) !== JSON.stringify(rES.decisionFlow),
    "cross-country consistency: decisionFlow did not adapt by context"
  );

  // Validación de contrato + coherencia
  [r1, r2, rAR, rCL, rES].forEach((result, idx) => {
    const label = `result-${idx + 1}`;
    assertAnalysisResultShape(result, label);
    assertRiesgoEstadoCoherence(result, label);
    assertActionPlanConsistency(result, label);
  });

  return {
    ok: true,
    checked: 5,
    message: "Engine consistency tests passed.",
  };
}

if (typeof require !== "undefined" && require.main === module) {
  try {
    const out = runEngineConsistencyTests();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(out, null, 2));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[engineConsistency.test] FAIL:", error);
    process.exitCode = 1;
  }
}
