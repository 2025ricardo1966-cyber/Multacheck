type SmokeRequest = {
  patente: string;
  provinciaSeleccionada: string | null;
  legalContext: {
    role: "public" | "enterprise" | "admin";
    pais: string;
    ruleset: string;
    intentionProfile: string;
    vocabularyProfile: string;
    notificationStatus: "notified" | "notified_formal" | "not_notified" | null;
  };
};

function fail(reason: string): never {
  throw new Error(`FAIL - ${reason}`);
}

async function runSmokeE2E(): Promise<void> {
  const { AR_Ruleset } = await import(
    new URL("../core/rules/AR.ts", import.meta.url).href
  );
  const { analyzeMultaV1 } = await import(
    new URL("../core/api/multacheck/v1/analyze.ts", import.meta.url).href
  );

  const mutableRuleset = AR_Ruleset as {
    execute: typeof AR_Ruleset.execute;
  };
  let executeCalls = 0;
  const originalExecute = mutableRuleset.execute;

  mutableRuleset.execute = ((input: Parameters<typeof originalExecute>[0]) => {
    executeCalls += 1;
    return originalExecute(input);
  }) as typeof mutableRuleset.execute;

  const payload: SmokeRequest = {
    patente: "AA123BB",
    provinciaSeleccionada: "Buenos Aires",
    legalContext: {
      role: "public",
      pais: "AR",
      ruleset: "AR",
      intentionProfile: "administrative_defense_oriented",
      vocabularyProfile: "argentina_legal_spanish",
      notificationStatus: null,
    },
  };

  try {
    const sessionId = `smoke-${Date.now()}`;
    const data = analyzeMultaV1(payload, {
      sessionId,
      userId: "smoke-e2e-user",
      requestFingerprint: "multacheck-smoke-test",
    });

    if ("error" in data) {
      fail(`respuesta con error: ${data.error}`);
    }

    const result = data.result;
    if (!result || typeof result !== "object") {
      fail("result no presente");
    }

    if (result.riesgo == null) fail("riesgo no debe ser null");
    if (result.estado == null) fail("estado no debe ser null");

    const recomendacion = String(result.recomendacion ?? "");
    const blockedRecommendations = [
      "Revisar la infracción según normativa vigente de la jurisdicción seleccionada.",
      "Recomendación: validar documentación y continuar con revisión administrativa.",
    ];
    if (!recomendacion.trim() || blockedRecommendations.includes(recomendacion.trim())) {
      fail("recomendacion mock/fallback detectada");
    }

    if (!Array.isArray(result.decisionFlow)) {
      fail("decisionFlow debe existir y ser array");
    }

    if (typeof result.actionPlan !== "string" || !result.actionPlan.trim()) {
      fail("actionPlan debe ser string no vacío");
    }

    if (result.externalConstraintDetected !== null) {
      fail("externalConstraintDetected incoherente para patente válida");
    }

    if (executeCalls < 1) {
      fail("AR_Ruleset.execute no fue ejecutado (posible bypass)");
    }

    // eslint-disable-next-line no-console
    console.log("PASS - smoke E2E integrado");
  } finally {
    mutableRuleset.execute = originalExecute;
  }
}

runSmokeE2E().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(String(error instanceof Error ? error.message : error));
  process.exitCode = 1;
});
