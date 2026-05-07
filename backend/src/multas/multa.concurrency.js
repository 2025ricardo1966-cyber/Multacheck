/**
 * Cola FIFO por clave (p.ej. multaId o analyze:tenant:user:hash).
 * Serializa trabajo async en un solo proceso Node; en múltiples réplicas usar lock distribuido adicional.
 */
const chains = new Map();

export function runWithConcurrencyLock(lockKey, fn) {
  const prev = chains.get(lockKey) ?? Promise.resolve();
  // Continue the queue after predecessor failure (do not skip fn on rejection).
  const run = prev.catch(() => {}).then(() => fn());
  chains.set(lockKey, run);
  run.finally(() => {
    if (chains.get(lockKey) === run) {
      chains.delete(lockKey);
    }
  });
  return run;
}
