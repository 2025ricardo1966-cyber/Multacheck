/** Tipos de señal generados por el motor (determinísticos). */
export const FraudSignalType = Object.freeze({
  HIGH_FREQUENCY_REPEATS: "HIGH_FREQUENCY_REPEATS",
  CROSS_JURISDICTION_CHAINING: "CROSS_JURISDICTION_CHAINING",
  TEMPORAL_CLUSTER_SPIKES: "TEMPORAL_CLUSTER_SPIKES",
  SHARED_ENTITY_COLLUSION: "SHARED_ENTITY_COLLUSION",
});

/** Ventanas temporales estándar (ms). */
export const FraudTimeWindows = Object.freeze({
  H24: 24 * 60 * 60 * 1000,
  D7: 7 * 24 * 60 * 60 * 1000,
  D30: 30 * 24 * 60 * 60 * 1000,
});
