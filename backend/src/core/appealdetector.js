export function detectAppealOpportunity(multaData, aiAnalysis, issues, finalScore) {
    let appeal = {
      recommended: false,
      reasons: []
    };
  
    // =========================
    // REGLAS DE APELACIÓN
    // =========================
  
    // 1. Inconsistencias detectadas
    if (issues.length > 0) {
      appeal.recommended = true;
      appeal.reasons.push("Se detectaron inconsistencias en la evaluación");
    }
  
    // 2. Score bajo (posible discutible)
    if (finalScore <= 50) {
      appeal.recommended = true;
      appeal.reasons.push("La infracción tiene bajo puntaje, posible margen de apelación");
    }
  
    // 3. Falta de descripción
    if (!multaData.description) {
      appeal.recommended = true;
      appeal.reasons.push("Falta información clave en la multa");
    }
  
    return appeal;
  }
