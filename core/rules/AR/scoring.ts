import type { RiesgoNivel } from "./risk";

export function calcularScoreAR(
  patente: string,
  provinciaSeleccionada: string | null,
  paisSeleccionado: string
): number {
  const semilla = `${patente}-${provinciaSeleccionada ?? "NACIONAL"}-${paisSeleccionado}`;
  return (
    semilla.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10
  );
}

export function riesgoDesdeScore(score: number): RiesgoNivel {
  if (score >= 7) return "alto";
  if (score >= 4) return "medio";
  return "bajo";
}
