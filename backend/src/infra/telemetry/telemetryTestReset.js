import { __resetTelemetryMetricsForTests } from "./telemetryMetrics.js";
import { __resetTelemetryAnomalyForTests } from "./telemetryAnomaly.js";

export function __resetTelemetryForTests() {
  __resetTelemetryMetricsForTests();
  __resetTelemetryAnomalyForTests();
}
