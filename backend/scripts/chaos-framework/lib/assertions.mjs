/**
 * Clasificación de fallos y aserciones de seguridad (sin mutación de negocio).
 */

/** @typedef {{ code: string, detail?: string }} ChaosFailure */

export function classifyFetchError(err) {
  const name = err?.name ?? "";
  const msg = err?.message ?? String(err);
  if (name === "AbortError" || msg.includes("aborted")) {
    return { code: "TIMEOUT_OR_ABORT", detail: msg };
  }
  if (msg.includes("ECONNREFUSED")) {
    return { code: "CONNECTION_REFUSED", detail: msg };
  }
  return { code: "FETCH_ERROR", detail: msg };
}

/**
 * No fallos silenciosos: todo resultado debe ser clasificable (HTTP o error de red explícito).
 */
export function assertExplicitOutcome(ok, outcome) {
  if (!ok && !outcome?.failureClass) {
    throw new Error("CHAOS_ASSERTION: outcome sin clasificación explícita");
  }
}
