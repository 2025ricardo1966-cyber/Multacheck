export type EnvironmentMode = "development" | "staging" | "production";

function normalizeMode(input?: string | null): EnvironmentMode {
  const raw = String(input ?? "").trim().toLowerCase();
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "staging" || raw === "stage") return "staging";
  return "development";
}

function resolveMode(): EnvironmentMode {
  const explicit = normalizeMode(process.env.MULTACHECK_ENV);
  if (explicit !== "development" || process.env.MULTACHECK_ENV) {
    return explicit;
  }

  return normalizeMode(process.env.NODE_ENV);
}

const mode = resolveMode();
const isProduction = mode === "production";
const isStaging = mode === "staging";
const isDevelopment = mode === "development";

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

const defaultFlags = isDevelopment
  ? {
      enableObservabilityLogs: true,
      enableStrictValidation: false,
      enableMockSimulation: true,
      enableRoleFiltering: true,
    }
  : isStaging
  ? {
      enableObservabilityLogs: false,
      enableStrictValidation: true,
      enableMockSimulation: false,
      enableRoleFiltering: true,
    }
  : {
      enableObservabilityLogs: false,
      enableStrictValidation: true,
      enableMockSimulation: false,
      enableRoleFiltering: true,
    };

export const ENV = Object.freeze({
  mode,
  isProduction,
  isStaging,
  isDevelopment,
  enableObservabilityLogs: isProduction
    ? false
    : boolEnv(
        "MULTACHECK_ENABLE_OBSERVABILITY_LOGS",
        defaultFlags.enableObservabilityLogs
      ),
  enableStrictValidation: isProduction
    ? true
    : boolEnv(
        "MULTACHECK_ENABLE_STRICT_VALIDATION",
        defaultFlags.enableStrictValidation
      ),
  enableMockSimulation: isProduction
    ? false
    : boolEnv("MULTACHECK_ENABLE_MOCK_SIMULATION", defaultFlags.enableMockSimulation),
  enableRoleFiltering: isProduction
    ? true
    : boolEnv("MULTACHECK_ENABLE_ROLE_FILTERING", defaultFlags.enableRoleFiltering),
});
