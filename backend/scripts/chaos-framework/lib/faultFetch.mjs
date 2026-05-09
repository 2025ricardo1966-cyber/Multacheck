/**
 * Envoltorio de fetch con fallos inyectados solo en el harness (sin tocar el servidor).
 */

export async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {RequestInfo} url
 * @param {RequestInit} init
 * @param {{ injectLatencyMs?: number, timeoutMs?: number }} faults
 */
export async function faultFetch(url, init = {}, faults = {}) {
  const { injectLatencyMs = 0, timeoutMs } = faults;

  if (injectLatencyMs > 0) {
    await sleep(injectLatencyMs);
  }

  if (timeoutMs != null && timeoutMs >= 0) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  }

  return fetch(url, init);
}

/** Deadline por defecto para harness (evita colgarse detrás de IA lenta). */
export function fetchWithDeadline(url, init = {}, deadlineMs) {
  const ms =
    deadlineMs ??
    Number(process.env.CHAOS_FETCH_DEADLINE_MS?.trim() ?? 45000);
  return faultFetch(url, init, { timeoutMs: ms });
}
