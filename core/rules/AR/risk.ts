export type RiesgoNivel = "bajo" | "medio" | "alto";

export type EstadoAnalisis = "impugnable" | "revisable" | "critico";

export function estadoDesdeRiesgo(riesgo: RiesgoNivel): EstadoAnalisis {
  if (riesgo === "alto") return "critico";
  if (riesgo === "medio") return "revisable";
  return "impugnable";
}
