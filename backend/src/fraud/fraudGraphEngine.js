import crypto from "node:crypto";
import {
  FraudSignalType,
  FraudTimeWindows,
} from "./fraudConstants.js";
import { aggregateFraudSignals } from "./fraudSignalAggregator.js";
import { publishDomainEvent } from "../application/domainEvents.port.js";

/**
 * Motor de grafo de señales de fraude — capa paralela, sin ML, sin modificar scoring engine.
 *
 * Entrada: lote de registros normalizados (`FraudInputRecord`).
 * Salida: grafo (lista de adyacencia + aristas) + señales explicables.
 */

/**
 * @typedef {{
 *   id: string,
 *   occurredAt: string,
 *   plate?: string | null,
 *   userId?: string | null,
 *   tenantId?: string | null,
 *   jurisdictionKey: string,
 *   violationTypeKey: string,
 * }} FraudInputRecord
 */

/**
 * @typedef {{
 *   id: string,
 *   kind: "violation"|"vehicle"|"user"|"jurisdiction",
 *   label: string,
 *   meta?: Record<string, unknown>,
 * }} FraudGraphNode
 */

/**
 * @typedef {{
 *   from: string,
 *   to: string,
 *   kind: string,
 *   weight: number,
 *   at?: string,
 * }} FraudGraphEdge
 */

function nidViolation(id) {
  return `v:${id}`;
}
function nidPlate(p) {
  return `p:${String(p).trim().toUpperCase().replace(/\s+/g, "")}`;
}
function nidUser(uid) {
  return `u:${uid}`;
}
function nidJurisdiction(j) {
  return `j:${String(j).trim()}`;
}

export function normalizePlate(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Ordena registros por fecha ascendente (determinístico).
 * @param {FraudInputRecord[]} records
 */
export function sortRecordsByTime(records) {
  return [...records].sort((a, b) => {
    const ta = Date.parse(a.occurredAt);
    const tb = Date.parse(b.occurredAt);
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Construye grafo dirigido multi-relación (lista de aristas + índice de nodos).
 * @param {FraudInputRecord[]} records
 * @returns {{ nodes: Map<string, FraudGraphNode>, edges: FraudGraphEdge[], adjacency: Map<string, FraudGraphEdge[]> }}
 */
export function buildFraudGraph(records) {
  const sorted = sortRecordsByTime(records);
  /** @type {Map<string, FraudGraphNode>} */
  const nodes = new Map();
  /** @type {FraudGraphEdge[]} */
  const edges = [];

  const addNode = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };

  for (const r of sorted) {
    const vid = nidViolation(r.id);
    addNode({
      id: vid,
      kind: "violation",
      label: r.id,
      meta: {
        violationTypeKey: r.violationTypeKey,
        occurredAt: r.occurredAt,
      },
    });

    const jid = nidJurisdiction(r.jurisdictionKey);
    addNode({
      id: jid,
      kind: "jurisdiction",
      label: r.jurisdictionKey,
      meta: {},
    });

    edges.push({
      from: vid,
      to: jid,
      kind: "VIOLATION_IN_JURISDICTION",
      weight: 1,
      at: r.occurredAt,
    });

    const plate = normalizePlate(r.plate);
    if (plate) {
      const pid = nidPlate(plate);
      addNode({
        id: pid,
        kind: "vehicle",
        label: plate,
        meta: {},
      });
      edges.push({
        from: vid,
        to: pid,
        kind: "VIOLATION_PLATE",
        weight: 1,
        at: r.occurredAt,
      });
    }

    if (r.userId != null && String(r.userId).trim() !== "") {
      const uid = nidUser(r.userId);
      addNode({
        id: uid,
        kind: "user",
        label: String(r.userId),
        meta: { tenantId: r.tenantId ?? null },
      });
      edges.push({
        from: vid,
        to: uid,
        kind: "VIOLATION_BY_USER",
        weight: 1,
        at: r.occurredAt,
      });
    }
  }

  /** @type {Map<string, FraudGraphEdge[]>} */
  const adjacency = new Map();
  for (const e of edges) {
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    adjacency.get(e.from).push(e);
  }

  for (const [, arr] of adjacency) {
    arr.sort((a, b) => String(a.to).localeCompare(String(b.to)));
  }

  return { nodes, edges, adjacency };
}

function clamp01(x) {
  return Math.max(0, Math.min(100, x));
}

/**
 * Severidad determinística 0–100 desde conteos normalizados.
 */
function severityFromCount(count, threshold, cap = 100) {
  if (count < threshold) return 0;
  const excess = count - threshold + 1;
  return clamp01(Math.min(cap, 40 + excess * 15));
}

function confidenceFromEvidence(evidenceCount, maxEdges) {
  const base = 50 + Math.min(40, evidenceCount * 8);
  const edgeBoost = Math.min(10, maxEdges * 2);
  return clamp01(base + edgeBoost);
}

/**
 * @param {FraudInputRecord[]} sorted
 * @param {ReturnType<typeof buildFraudGraph>} graph
 */
export function detectHighFrequencyRepeats(sorted, graph) {
  /** @type {Map<string, FraudInputRecord[]>} */
  const keyMap = new Map();
  for (const r of sorted) {
    const plate = normalizePlate(r.plate);
    if (!plate) continue;
    const k = `${plate}|${r.violationTypeKey}`;
    if (!keyMap.has(k)) keyMap.set(k, []);
    keyMap.get(k).push(r);
  }

  /** @type {Array<Record<string, unknown>>} */
  const out = [];
  const windowMs = FraudTimeWindows.D7;
  const thresholdCount = 3;

  for (const [k, group] of keyMap.entries()) {
    const [platePart] = k.split("|");
    if (group.length < thresholdCount) continue;

    const groupSorted = sortRecordsByTime(group);
    const dates = groupSorted.map((g) => Date.parse(g.occurredAt));
    let windowStart = 0;
    let maxInWindow = 0;
    let bestSlice = [];
    for (let i = 0; i < dates.length; i++) {
      while (dates[i] - dates[windowStart] > windowMs) windowStart++;
      const slice = groupSorted.slice(windowStart, i + 1);
      if (slice.length > maxInWindow) {
        maxInWindow = slice.length;
        bestSlice = slice;
      }
    }
    if (maxInWindow < thresholdCount) continue;

    const plate = platePart;
    const path = [
      ...bestSlice.map((r) => nidViolation(r.id)),
      nidPlate(plate),
    ];
    const contributingEdges = graph.edges.filter(
      (e) =>
        path.includes(e.from) &&
        (path.includes(e.to) || e.to === nidPlate(plate))
    );

    out.push({
      signalType: FraudSignalType.HIGH_FREQUENCY_REPEATS,
      severityScore: severityFromCount(maxInWindow, thresholdCount),
      confidenceIndex: confidenceFromEvidence(bestSlice.length, contributingEdges.length),
      evidenceNodeIds: [...new Set(path)],
      reasonCodes: ["MULTIPLE_SAME_TYPE_SAME_PLATE_7D_WINDOW"],
      contributingEdges: contributingEdges.slice(0, 50),
      graphPathExplanation: path,
      meta: { plate, violationTypeKey: bestSlice[0]?.violationTypeKey, count: maxInWindow },
    });
  }

  return out;
}

export function detectCrossJurisdictionChaining(sorted, graph) {
  /** plate -> FraudInputRecord[] */
  const plateRecs = new Map();

  for (const r of sorted) {
    const plate = normalizePlate(r.plate);
    if (!plate) continue;
    if (!plateRecs.has(plate)) plateRecs.set(plate, []);
    plateRecs.get(plate).push(r);
  }

  const out = [];
  const windowMs = FraudTimeWindows.D30;

  for (const [plate, recs] of plateRecs.entries()) {
    if (recs.length < 2) continue;

    const times = recs.map((x) => Date.parse(x.occurredAt)).sort((a, b) => a - b);
    let foundWindow = null;
    let i = 0;
    for (let j = 0; j < recs.length; j++) {
      while (times[j] - times[i] > windowMs) i += 1;
      const slice = recs.slice(i, j + 1);
      const jurs = new Set(slice.map((x) => x.jurisdictionKey));
      if (jurs.size >= 2) {
        foundWindow = { slice, jurs };
        break;
      }
    }

    if (!foundWindow) continue;

    const { slice, jurs } = foundWindow;
    const path = [
      nidPlate(plate),
      ...[...jurs].sort().map((j) => nidJurisdiction(j)),
    ];
    const contributingEdges = graph.edges.filter(
      (e) =>
        e.to === nidPlate(plate) ||
        (e.kind === "VIOLATION_IN_JURISDICTION" &&
          slice.some((r) => nidViolation(r.id) === e.from))
    );

    out.push({
      signalType: FraudSignalType.CROSS_JURISDICTION_CHAINING,
      severityScore: clamp01(35 + jurs.size * 20),
      confidenceIndex: confidenceFromEvidence(slice.length, contributingEdges.length),
      evidenceNodeIds: path,
      reasonCodes: ["SAME_PLATE_MULTI_JURISDICTION_SLIDING_30D"],
      contributingEdges: contributingEdges.slice(0, 80),
      graphPathExplanation: path,
      meta: {
        plate,
        jurisdictions: [...jurs].sort(),
        windowRecordCount: slice.length,
      },
    });
  }

  return out;
}

/**
 * Picos temporales: mismo usuario o misma patente con ≥ N eventos en ventana 24h (umbral fijo).
 */
export function detectTemporalClusterSpikes(sorted, graph) {
  const windowMs = FraudTimeWindows.H24;
  const threshold = 4;

  /** @type {Map<string, FraudInputRecord[]>} */
  const byEntity = new Map();

  const pushEntity = (key, r) => {
    if (!byEntity.has(key)) byEntity.set(key, []);
    byEntity.get(key).push(r);
  };

  for (const r of sorted) {
    const plate = normalizePlate(r.plate);
    if (plate) pushEntity(`plate:${plate}`, r);
    if (r.userId) pushEntity(`user:${r.userId}`, r);
  }

  const out = [];

  for (const [entityKey, group] of byEntity.entries()) {
    if (group.length < threshold) continue;

    const groupSorted = sortRecordsByTime(group);
    let maxWin = 0;
    let best = [];
    const times = groupSorted.map((g) => Date.parse(g.occurredAt));
    let ws = 0;
    for (let i = 0; i < times.length; i++) {
      while (times[i] - times[ws] > windowMs) ws++;
      const slice = groupSorted.slice(ws, i + 1);
      if (slice.length > maxWin) {
        maxWin = slice.length;
        best = slice;
      }
    }
    if (maxWin < threshold) continue;

    const path = best.map((r) => nidViolation(r.id));
    const contributingEdges = graph.edges.filter((e) =>
      path.includes(e.from)
    );

    out.push({
      signalType: FraudSignalType.TEMPORAL_CLUSTER_SPIKES,
      severityScore: severityFromCount(maxWin, threshold),
      confidenceIndex: confidenceFromEvidence(best.length, contributingEdges.length),
      evidenceNodeIds: [...new Set(path)],
      reasonCodes: ["ENTITY_EVENT_BURST_24H_FIXED_THRESHOLD"],
      contributingEdges: contributingEdges.slice(0, 60),
      graphPathExplanation: path,
      meta: { entityKey, burstCount: maxWin },
    });
  }

  return out;
}

/**
 * Misma patente asociada a ≥2 usuarios distintos en ventana 7d.
 */
export function detectSharedEntityCollusion(sorted, graph) {
  const windowMs = FraudTimeWindows.D7;
  const out = [];

  /** plate -> FraudInputRecord[] */
  const plateRecs = new Map();
  for (const r of sorted) {
    const plate = normalizePlate(r.plate);
    if (!plate || !r.userId) continue;
    if (!plateRecs.has(plate)) plateRecs.set(plate, []);
    plateRecs.get(plate).push(r);
  }

  for (const [plate, recs] of plateRecs.entries()) {
    const users = [...new Set(recs.map((r) => String(r.userId)))].sort();
    if (users.length < 2) continue;

    let colluding = false;
    let i = 0;
    const sortedRecs = [...recs].sort(
      (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
    );
    for (let j = 0; j < sortedRecs.length; j++) {
      while (
        i <= j &&
        Date.parse(sortedRecs[j].occurredAt) -
          Date.parse(sortedRecs[i].occurredAt) >
          windowMs
      ) {
        i += 1;
      }
      const slice = sortedRecs.slice(i, j + 1);
      const uInWin = new Set(slice.map((x) => String(x.userId)));
      if (uInWin.size >= 2) {
        colluding = true;
        break;
      }
    }
    if (!colluding) continue;

    const path = [nidPlate(plate), ...users.map((u) => nidUser(u))];
    const contributingEdges = graph.edges.filter(
      (e) =>
        e.to === nidPlate(plate) &&
        recs.some((r) => nidViolation(r.id) === e.from)
    );

    out.push({
      signalType: FraudSignalType.SHARED_ENTITY_COLLUSION,
      severityScore: clamp01(45 + (users.length - 2) * 18),
      confidenceIndex: confidenceFromEvidence(users.length, contributingEdges.length),
      evidenceNodeIds: path,
      reasonCodes: ["MULTI_USER_SINGLE_PLATE_SLIDING_7D"],
      contributingEdges: contributingEdges.slice(0, 60),
      graphPathExplanation: path,
      meta: { plate, distinctUsers: users.length },
    });
  }

  return out;
}

/**
 * Ejecuta pipeline completo sobre un lote (determinístico para mismo dataset orden estable).
 * @param {FraudInputRecord[]} records
 */
export function runFraudSignalGraphEngine(records) {
  const sorted = sortRecordsByTime(records);
  const graph = buildFraudGraph(sorted);

  const signals = [
    ...detectHighFrequencyRepeats(sorted, graph),
    ...detectCrossJurisdictionChaining(sorted, graph),
    ...detectTemporalClusterSpikes(sorted, graph),
    ...detectSharedEntityCollusion(sorted, graph),
  ];

  signals.sort((a, b) => {
    const ta = String(a.signalType).localeCompare(String(b.signalType));
    if (ta !== 0) return ta;
    return (b.severityScore ?? 0) - (a.severityScore ?? 0);
  });

  const aggregation = aggregateFraudSignals(signals);

  const batchCorr = crypto
    .createHash("sha256")
    .update(sorted.map((r) => String(r.id)).sort().join("\n"))
    .digest("hex")
    .slice(0, 32);

  publishDomainEvent({
    module_source: "fraud.graph_engine",
    type: "fraud.graph.completed",
    payload: {
      record_count: records.length,
      signal_count: signals.length,
      aggregated_count: aggregation.aggregatedSignals?.length ?? 0,
      graph_nodes: graph.nodes.size,
      graph_edges: graph.edges.length,
    },
    _telemetryContextOverride: {
      requestId: `fraud:${batchCorr}`,
      traceId: `fraud:${batchCorr}`,
      spanId: crypto.randomBytes(8).toString("hex"),
    },
  });

  return {
    schema: "multacheck/fraud_graph_result/v1",
    graphSummary: {
      nodeCount: graph.nodes.size,
      edgeCount: graph.edges.length,
    },
    nodesForDebug: [...graph.nodes.values()].sort((a, b) =>
      a.id.localeCompare(b.id)
    ),
    edgesSample: graph.edges.slice(0, 500),
    signalsRaw: signals,
    signalsAggregated: aggregation.aggregatedSignals,
    aggregationSummary: aggregation.summary,
  };
}
