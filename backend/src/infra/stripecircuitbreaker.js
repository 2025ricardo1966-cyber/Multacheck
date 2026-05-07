/**
 * Circuit breaker in-process para fallos repetidos de Stripe (checkout).
 */

const FAILURE_THRESHOLD = 5;
const OPEN_MS = 90_000;

let consecutiveFailures = 0;
let openUntil = 0;

export function recordStripeCheckoutSuccess() {
  consecutiveFailures = 0;
  openUntil = 0;
}

export function recordStripeCheckoutFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    openUntil = Date.now() + OPEN_MS;
  }
}

export function isStripeCheckoutCircuitOpen() {
  if (Date.now() < openUntil) {
    return true;
  }
  if (openUntil > 0 && Date.now() >= openUntil) {
    consecutiveFailures = 0;
    openUntil = 0;
  }
  return false;
}

export function getStripeCircuitSnapshot() {
  return {
    consecutiveFailures,
    openUntil,
    open: isStripeCheckoutCircuitOpen(),
    threshold: FAILURE_THRESHOLD,
    openMs: OPEN_MS,
  };
}
