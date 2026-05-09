/**
 * Logs en una línea JSON (stdout). No mezcla con consola humana salvo stderr de errores fatales.
 * @param {string} event
 * @param {Record<string, unknown>} fields
 */
export function chaosLog(event, fields = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      component: "chaos_framework",
      event,
      ...fields,
    })
  );
}
