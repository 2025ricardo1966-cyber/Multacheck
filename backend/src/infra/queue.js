/**
 * Procesamiento asíncrono no bloqueante (stateless). Para BullMQ / workers dedicados, enganchá aquí.
 */
export function enqueueBackground(job) {
  setImmediate(() => {
    job().catch((e) => console.error("[queue]", e.message));
  });
}
