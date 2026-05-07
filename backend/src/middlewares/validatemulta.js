export function validateMultaData(req, res, next) {
  const { body } = req;
  const errores = [];

  // =========================
  // VALIDACIONES BÁSICAS
  // =========================

  if (!body.codigoJurisdiccion || body.codigoJurisdiccion.trim() === '') {
    errores.push('codigoJurisdiccion es obligatorio');
  }

  if (!body.userEmail || !body.userEmail.includes('@')) {
    errores.push('userEmail debe ser un email válido');
  }

  // =========================
  // VALIDACIÓN DE ESTRUCTURA
  // =========================

  if (!body.datosActa || typeof body.datosActa !== 'object') {
    errores.push('datosActa debe ser un objeto con los detalles de la multa');
  }

  if (body.datosActa && !body.datosActa.fechaInfraccion) {
    errores.push('fechaInfraccion es obligatoria');
  }

  if (body.datosActa && !body.datosActa.tipo_infraccion) {
    errores.push('tipo_infraccion es obligatorio');
  }

  if (body.datosActa && (body.datosActa.observaciones === undefined || body.datosActa.observaciones === null)) {
    errores.push('observaciones es obligatorio');
  }

  // =========================
  // CONTROL DE ERRORES
  // =========================

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      detalles: errores
    });
  }

  // OK → continúa flujo al engine
  next();
}
