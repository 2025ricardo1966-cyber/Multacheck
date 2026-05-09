import type { RiesgoNivel } from "./risk";

export function recomendacionDesdeRiesgo(riesgo: RiesgoNivel): string {
  if (riesgo === "alto") {
    return "Recomendación: iniciar descargo técnico inmediato";
  }
  if (riesgo === "medio") {
    return "Revisar evidencia antes de pagar";
  }
  return "Probable multa menor sin impacto legal";
}
