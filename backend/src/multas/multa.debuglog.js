import { getAppMode, isVerboseLaunchLogging } from "../config/launchflags.js";

/** Logs estructurados mínimos para depuración del flujo multa (no analytics). */
export function multaFlowLog(tag, fields = {}) {
  const payload = {
    tag,
    t: new Date().toISOString(),
    ...fields,
  };
  if (isVerboseLaunchLogging()) {
    payload.appMode = getAppMode();
  }
  console.log(JSON.stringify(payload));
}
