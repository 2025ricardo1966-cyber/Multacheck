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
      appeal.reasons.push(
        "Se registraron posibles inconsistencias en los datos evaluados (valoración orientativa)"
      );
    }
  
    // 2. Score bajo (posible discutible)
    if (finalScore <= 50) {
      appeal.recommended = true;
      appeal.reasons.push(
        "Puntaje bajo: puede haber margen para evaluar impugnación o recurso administrativo, según el tipo de acto y los plazos locales"
      );
    }
  
    // 3. Falta de descripción
    if (!multaData.description) {
      appeal.recommended = true;
      appeal.reasons.push("Falta información clave en la multa");
    }
  
    return appeal;
  }
