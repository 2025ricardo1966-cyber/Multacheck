export function detectInconsistencies(multaData, aiAnalysis) {
    const issues = [];
  
    const desc = multaData.description?.toLowerCase() || "";
    const gravedad = aiAnalysis.gravedad;
  
    // =========================
    // REGLAS BÁSICAS
    // =========================
  
    // 1. Baja gravedad pero descripción fuerte
    if (gravedad === "baja" && desc.includes("prohibida")) {
      issues.push({
        type: "contradiccion",
        message: "Descripción sugiere mayor gravedad que la evaluada"
      });
    }
  
    // 2. Alta gravedad sin contexto fuerte
    if (gravedad === "alta" && !desc.includes("prohibida")) {
      issues.push({
        type: "posible_exceso",
        message: "Gravedad alta sin evidencia clara en descripción"
      });
    }
  
    // 3. Falta de descripción
    if (!desc) {
      issues.push({
        type: "datos_insuficientes",
        message: "No hay descripción de la infracción"
      });
    }
  
    return issues;
  }
