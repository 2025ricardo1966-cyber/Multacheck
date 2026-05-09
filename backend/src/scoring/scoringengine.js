/** Versión del manifiesto de reglas (informes de deriva / comparador). */
export const SCORING_ENGINE_MANIFEST_VERSION = "1.0.0";

export const BASE_RULES = Object.freeze({
  estacionamiento: 30,
  velocidad: 50,
  semaforo: 70,
  otros: 20,
});

export const GRAVEDAD_BONUS = Object.freeze({
  baja: -10,
  media: 0,
  alta: 20,
});

export function calculateScore(multaData, aiAnalysis) {
    const tipo = multaData.type || "otros";
    const gravedad = aiAnalysis.gravedad || "media";
  
    let score = BASE_RULES[tipo] || BASE_RULES["otros"];
  
    // =========================
    // AJUSTE POR IA (más determinista)
    // =========================
    score += GRAVEDAD_BONUS[gravedad] || 0;
  
    const desc = multaData.description?.toLowerCase() || "";
  
    // =========================
    // CONTEXTO
    // =========================
    if (desc.includes("prohibida")) {
      score += 15;
    }
  
    if (desc.includes("doble fila")) {
      score += 20;
    }
  
    if (desc.includes("emergencia")) {
      score += 30;
    }
  
    // =========================
    // PENALIZACIÓN POR FALTA DE DATOS
    // =========================
    if (!desc) {
      score -= 10;
    }
  
    // =========================
    // NORMALIZACIÓN
    // =========================
    score = Math.max(0, Math.min(100, Math.round(score)));
  
    return score;
  }
