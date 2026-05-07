export function applyCountryRules(baseScore, country) {
    let finalScore = baseScore;
  
    if (country === "AR") {
      // =========================
      // AJUSTES LEGALES ARGENTINA
      // =========================
  
      // Normalización base
      if (finalScore < 30) finalScore += 10;
  
      // Penalización por gravedad alta
      if (finalScore >= 70) {
        finalScore += 10;
      }
  
      // Tope legal
      finalScore = Math.min(100, finalScore);
    }
  
    return finalScore;
  }