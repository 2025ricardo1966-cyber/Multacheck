export const consultarPatenteService = async (patente) => {

  if (!patente) {
    throw new Error("Patente vacía");
  }

  let res;

  try {
    res = await fetch("http://localhost:5000/api/analizar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        codigoJurisdiccion: "TEST",
        userEmail: "frontend@test.com",
        datosActa: {
          tipo_infraccion: "consulta_patente",
          observaciones: `Patente consultada: ${patente}`,
          fechaInfraccion: new Date().toISOString().split("T")[0]
        }
      })
    });
  } catch (error) {
    console.error("ERROR DE CONEXIÓN BACKEND:", error);
    throw new Error("No se pudo conectar con el backend");
  }

  if (!res.ok) {
    throw new Error("Error en backend (respuesta no OK)");
  }

  const data = await res.json();

  return {
    data: {
      tipo: data.valido ? "verde" : "rojo",
      score: data.score,
      confianza: data.confianza,
      conclusion: data.conclusion,
      alertas: data.alertas
    },
    source: "api"
  };
};