const rawMode = String(
  process.env.MULTACHECK_ENV || process.env.NODE_ENV || "development"
)
  .trim()
  .toLowerCase();

const mode =
  rawMode === "production" || rawMode === "prod"
    ? "production"
    : rawMode === "staging" || rawMode === "stage"
    ? "staging"
    : "development";

const boolEnv = (name) => {
  const value = process.env[name];
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
};

const explicit = {
  enableObservabilityLogs: boolEnv("MULTACHECK_ENABLE_OBSERVABILITY_LOGS"),
  enableStrictValidation: boolEnv("MULTACHECK_ENABLE_STRICT_VALIDATION"),
  enableMockSimulation: boolEnv("MULTACHECK_ENABLE_MOCK_SIMULATION"),
  enableRoleFiltering: boolEnv("MULTACHECK_ENABLE_ROLE_FILTERING"),
};

if (mode === "production") {
  if (explicit.enableObservabilityLogs === true) {
    console.error(
      "[env-policy-check] Invalid production flag: MULTACHECK_ENABLE_OBSERVABILITY_LOGS=true"
    );
    process.exit(1);
  }
  if (explicit.enableMockSimulation === true) {
    console.error(
      "[env-policy-check] Invalid production flag: MULTACHECK_ENABLE_MOCK_SIMULATION=true"
    );
    process.exit(1);
  }
  if (explicit.enableStrictValidation === false) {
    console.error(
      "[env-policy-check] Invalid production flag: MULTACHECK_ENABLE_STRICT_VALIDATION=false"
    );
    process.exit(1);
  }
  if (explicit.enableRoleFiltering === false) {
    console.error(
      "[env-policy-check] Invalid production flag: MULTACHECK_ENABLE_ROLE_FILTERING=false"
    );
    process.exit(1);
  }
}

console.log(`[env-policy-check] Mode ${mode} validated.`);
