/**
 * Logs de seguridad backend (no analytics).
 * Tags: UNAUTHORIZED_ACCESS_ATTEMPT, DISCHARGE_BLOCKED_NOT_PAID, DISCHARGE_BLOCKED_NOT_OWNER
 */
export function securityLog(tag, fields = {}) {
  console.log(
    JSON.stringify({
      tag,
      t: new Date().toISOString(),
      ...fields,
    })
  );
}
