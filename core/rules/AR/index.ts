import { recomendacionDesdeRiesgo } from "./recommendation";
import { estadoDesdeRiesgo } from "./risk";
import { calcularScoreAR, riesgoDesdeScore } from "./scoring";
import { validateExternalConstraintAR } from "./validator";

export function generateResultadoAnalisisAR(
  patente: string,
  provinciaSeleccionada: string | null,
  paisSeleccionado: string
) {
  const score = calcularScoreAR(patente, provinciaSeleccionada, paisSeleccionado);
  const riesgo = riesgoDesdeScore(score);
  const estado = estadoDesdeRiesgo(riesgo);
  const recomendacion = recomendacionDesdeRiesgo(riesgo);
  const externalConstraintDetected = validateExternalConstraintAR(patente);

  return {
    riesgo,
    estado,
    recomendacion,
    externalConstraintDetected,
  };
}
