/** Mensajes fijos — sin detalles técnicos ni terminología de infraestructura. */
const MSG = {
  unauthorized:
    "No pudimos continuar con esta operación.",
  rateLimit:
    "Demasiadas solicitudes. Intentá nuevamente en unos minutos.",
  server:
    "El sistema tuvo un inconveniente temporal.",
  timeout:
    "La consulta está demorando más de lo esperado.",
  network:
    "No pudimos conectar con el servicio. Verificá tu conexión e intentá de nuevo.",
  generic:
    "Algo salió mal. Intentá de nuevo en unos momentos.",
  analyzeFallback:
    "El análisis no pudo completarse. Reintentá.",
};

const TECH_PATTERN =
  /\b(jwt|bearer|token|cors|axios|fetch|prisma|sql|stack|exception|trace|ECONN|ERR_|undefined|nullpointer)\b|^\s*error\s*:/i;

function looksTechnical(message) {
  if (!message || typeof message !== "string") return true;
  const s = message.trim();
  if (s.length > 220) return true;
  return TECH_PATTERN.test(s);
}

/**
 * Normaliza fallos de Axios / red a texto seguro para mostrar al usuario.
 */
export function friendlyApiError(err) {
  if (!err || typeof err !== "object") return MSG.generic;

  const code = err.code;
  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return MSG.timeout;
  }
  if (code === "ERR_NETWORK") {
    return MSG.network;
  }

  const status = err.response?.status;
  if (status === 401) return MSG.unauthorized;
  if (status === 429) return MSG.rateLimit;
  if (status === 408 || status === 504) return MSG.timeout;
  if (status >= 500 && status < 600) return MSG.server;
  if (status === 403) return MSG.unauthorized;

  const raw =
    err.response?.data?.error ??
    err.response?.data?.message ??
    null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t && !looksTechnical(t)) return t;
  }

  if (!err.response) return MSG.network;

  return MSG.generic;
}

/**
 * Respuesta JSON de analyze con `success: false` — evita filtrar errores crudos del backend.
 */
/** Para `success !== true` en el cuerpo JSON (incluye respuestas ambiguas). */
export function friendlyAnalyzeResponse(data) {
  const payload =
    data?.success === false
      ? data
      : { success: false, error: data?.error ?? null };
  const raw =
    typeof payload.error === "string" ? payload.error.trim() : "";
  if (raw && !looksTechnical(raw)) return raw;
  return MSG.analyzeFallback;
}
