export function classifyRisk(finalScore) {
    if (finalScore >= 70) {
      return "alto";
    }
  
    if (finalScore >= 40) {
      return "medio";
    }
  
    return "bajo";
  }
