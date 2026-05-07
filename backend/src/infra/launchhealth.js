/**
 * Estado operativo STABLE / DEGRADED e incidencias en ventana deslizante (sin SaaS externo).
 */

const WINDOW_MS = 10 * 60 * 1000;
const WEBHOOK_FAIL_DEGRADE = 6;
const CHECKOUT_FAIL_DEGRADE = 10;
const REPORT_FAIL_DEGRADE = 8;
const INTEGRITY_DEGRADE = 3;

const webhookFailures = [];
const checkoutFailures = [];
const reportGenFailures = [];
const integrityMismatches = [];
const reportGenBlocked = [];

function prune(arr) {
  const now = Date.now();
  while (arr.length && now - arr[0] > WINDOW_MS) {
    arr.shift();
  }
}

function countRecent(arr) {
  prune(arr);
  return arr.length;
}

export function recordWebhookFailure() {
  webhookFailures.push(Date.now());
  prune(webhookFailures);
}

export function recordCheckoutFailure() {
  checkoutFailures.push(Date.now());
  prune(checkoutFailures);
}

export function recordReportGenerationFailure() {
  reportGenFailures.push(Date.now());
  prune(reportGenFailures);
}

export function recordIntegrityMismatch() {
  integrityMismatches.push(Date.now());
  prune(integrityMismatches);
}

export function recordReportGenerationBlocked() {
  reportGenBlocked.push(Date.now());
  prune(reportGenBlocked);
}

export function getOperationalState() {
  const wf = countRecent(webhookFailures);
  const cf = countRecent(checkoutFailures);
  const rf = countRecent(reportGenFailures);
  const im = countRecent(integrityMismatches);
  const rb = countRecent(reportGenBlocked);

  const degraded =
    wf >= WEBHOOK_FAIL_DEGRADE ||
    cf >= CHECKOUT_FAIL_DEGRADE ||
    rf >= REPORT_FAIL_DEGRADE ||
    im >= INTEGRITY_DEGRADE;

  return {
    state: degraded ? "DEGRADED" : "STABLE",
    incidents: {
      webhookFailuresWindow: wf,
      checkoutFailuresWindow: cf,
      reportGenerationFailuresWindow: rf,
      integrityMismatchesWindow: im,
      reportGenBlockedWindow: rb,
      windowMinutes: WINDOW_MS / 60000,
    },
  };
}
