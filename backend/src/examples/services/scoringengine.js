import fs from 'fs';

const reglasConfig = JSON.parse(
  fs.readFileSync(new URL('../../rules/multasRules.json', import.meta.url))
);

async function analizarMulta(multaData) {
  console.log('🔍 Analizando multa:', multaData);

  const señales = [];
  const razones = [];
  const alertas = [];
  const trace = [];

  // ========================
  // VALIDACIÓN INPUT
  // ========================
  if (!multaData.tipo_infraccion) alertas.push('Falta tipo de infracción');

  if (!multaData.jurisdiccion) alertas.push('Falta jurisdicción');

  if (!multaData.fecha_infraccion) alertas.push('Falta fecha de infracción');

  const calcularCalidad = (data) => {
    const validaciones = [
      data.tipo_infraccion,
      data.jurisdiccion,
      data.fecha_infraccion
    ];
    return validaciones.filter(Boolean).length / validaciones.length;
  };

  const calidadInput = calcularCalidad(multaData);

  const calcularAniosDesdeFechaInfraccion = (data) => {
    if (!data.fecha_infraccion) return null;
    const fecha = new Date(data.fecha_infraccion);
    const hoy = new Date();
    return (hoy - fecha) / (1000 * 60 * 60 * 24 * 365);
  };

  const resolverCondicion = (regla) => {
    if (regla.tipo === 'antiguedad' && regla.condicion === 'mayor_a_5') {
      return (data) => {
        const años = calcularAniosDesdeFechaInfraccion(data);
        return años !== null && años > 5;
      };
    }

    if (regla.tipo === 'antiguedad' && regla.condicion === 'entre_2_y_5') {
      return (data) => {
        const años = calcularAniosDesdeFechaInfraccion(data);
        return años !== null && años > 2 && años <= 5;
      };
    }

    if (regla.tipo === 'tipo_infraccion' && regla.condicion === 'igual_velocidad') {
      return (data) => data.tipo_infraccion === 'velocidad';
    }

    if (regla.tipo === 'tipo_infraccion' && regla.condicion === 'igual_semaforo') {
      return (data) => data.tipo_infraccion === 'semaforo';
    }

    if (regla.tipo === 'calidad_input' && regla.condicion === 'menor_a_0_5') {
      return (data) => {
        const calidad = calcularCalidad(data);
        return calidad < 0.5;
      };
    }

    return () => false;
  };

  const reglas = reglasConfig.map((regla) => ({
    ...regla,
    condicionFn: resolverCondicion(regla)
  }));

  // ========================
  // SEÑALES
  // ========================

  reglas.forEach((regla) => {
    if (!regla.condicionFn(multaData)) return;

    // Importante: la señal no debe incluir funciones (condicionFn) para mantenerla serializable.
    const { condicionFn, ...reglaAplicada } = regla;
    señales.push(reglaAplicada);

    if (regla.razon) {
      razones.push(regla.razon);
    }
  });

  // ========================
  // SCORE DINÁMICO
  // ========================
  let score = 50;

  señales.forEach(s => {
    score += s.peso;
    const bonus = s.gravedad === 'alta' ? 5 : s.gravedad === 'media' ? 2 : 0;
    score += bonus;
    trace.push({
      regla: s.nombre,
      impacto: s.peso + bonus,
      motivo: s.motivo
        ? `${s.motivo}. Peso ${s.peso} + bonus ${bonus} (gravedad: ${s.gravedad})`
        : `Peso ${s.peso} + bonus ${bonus} (gravedad: ${s.gravedad})`
    });
  });

  // Clamp (0 - 100)
  score = Math.max(0, Math.min(100, score));

  // ========================
  // CONFIANZA
  // ========================
  let confianza = 'media';

  if (calidadInput < 0.6) confianza = 'baja';
  else if (score >= 75) confianza = 'alta';

  // ========================
  // CONCLUSIÓN
  // ========================
  let conclusion = '';

  if (score >= 80) {
    conclusion = 'Alta probabilidad de nulidad o prescripción';
  } else if (score >= 60) {
    conclusion = 'Caso con fundamentos sólidos para revisión';
  } else if (score >= 40) {
    conclusion = 'Caso dudoso, requiere análisis adicional';
  } else {
    conclusion = 'Caso con baja probabilidad de éxito';
  }

  // ========================
  // RECOMENDACIÓN
  // ========================
  let recomendacion = '';

  if (score >= 80) {
    recomendacion = 'Iniciar reclamo formal inmediato';
  } else if (score >= 60) {
    recomendacion = 'Revisar documentación y evaluar descargo';
  } else if (score >= 40) {
    recomendacion = 'Reunir más información antes de accionar';
  } else {
    recomendacion = 'No se recomienda accionar legalmente';
  }

  return {
    valido: score >= 50,
    score,
    confianza,
    calidadInput,
    conclusion,
    recomendacion,
    razones,
    señales,
    alertas,
    trace
  };
}

export default {
  analizarMulta
};