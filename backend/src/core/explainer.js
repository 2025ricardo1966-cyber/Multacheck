export function buildExplanation(multaData, aiAnalysis, baseScore, finalScore, issues) {
    const explanation = [];
  
    // =========================
    // 1. BASE
    // =========================
    explanation.push(`Tipo de infracción: ${multaData.type}`);
  
    // =========================
    // 2. IA
    // =========================
    explanation.push(`Gravedad estimada por IA: ${aiAnalysis.gravedad}`);
  
    // =========================
    // 3. SCORE
    // =========================
    explanation.push(`Puntaje base calculado: ${baseScore}`);
    explanation.push(`Puntaje final ajustado: ${finalScore}`);
  
    // =========================
    // 4. ISSUES
    // =========================
    if (issues.length > 0) {
      explanation.push("Se detectaron posibles inconsistencias:");
  
      issues.forEach((i) => {
        explanation.push(`- ${i.message}`);
      });
    } else {
      explanation.push("No se detectaron inconsistencias");
    }

    explanation.push(
      "Información orientativa de MultaCheck; no reemplaza asesoramiento profesional ni dictamen jurídico."
    );
  
    return explanation;
  }
