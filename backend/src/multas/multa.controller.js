import {
  createMultaFlow,
  analyzeAnonymousFlow,
  createDischargeCheckoutFlow,
  getPaymentStatusFlow,
  getMultaStateFlow,
  getMultaFullStateFlow,
  getDischargeFlow,
} from "./multa.service.js";
import {
  runAnalyzeHttpOrchestration,
  maybeSetOrchestratorReplayHeader,
} from "../infra/requestOrchestrator/httpAnalyzeOrchestrator.js";
import { publishDomainEvent } from "../application/domainEvents.port.js";

function sendServiceError(res, err, logTag) {
  const status = err.statusCode ?? 500;
  if (status >= 500) {
    console.error(logTag ? `[multa] ${logTag}:` : "[multa]", err);
  }
  return res.status(status).json({ error: err.message });
}

/**
 * =========================================================
 * MULTA CONTROLLER - HTTP LAYER ONLY
 * =========================================================
 */
export async function createMulta(req, res) {
  const t0 = Date.now();
  publishDomainEvent({
    module_source: "multa.http",
    type: "multa.http.analyze.enter",
    payload: { authenticated: !!req.auth },
  });
  try {
    async function runAnalyzeBusiness() {
      if (!req.auth) {
        return analyzeAnonymousFlow(req.body);
      }
      return createMultaFlow(req.auth, req.body, req.body?.options || {});
    }

    const out = await runAnalyzeHttpOrchestration(req, runAnalyzeBusiness);
    maybeSetOrchestratorReplayHeader(res, out);
    publishDomainEvent({
      module_source: "multa.http",
      type: "multa.http.analyze.exit",
      payload: {
        duration_ms: Date.now() - t0,
        outcome: "ok",
        orchestrator_kind: out.kind,
      },
    });
    return res.status(out.status).json(out.body);
  } catch (err) {
    publishDomainEvent({
      module_source: "multa.http",
      type: "multa.http.analyze.exit",
      severity_level: "error",
      payload: {
        duration_ms: Date.now() - t0,
        outcome: "error",
      },
    });
    return sendServiceError(res, err);
  }
}

/** POST /multa/analyze — con JWT + tenant persiste; sin JWT solo vista previa. */
export const analyze = createMulta;

export async function createDischargeCheckout(req, res) {
  try {
    const result = await createDischargeCheckoutFlow(
      req.auth,
      req.params.multaId,
      req.body
    );
    return res.status(200).json(result);
  } catch (err) {
    return sendServiceError(res, err, "discharge-checkout");
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const result = await getPaymentStatusFlow(req.auth, req.params.multaId);
    return res.json(result);
  } catch (err) {
    return sendServiceError(res, err);
  }
}

export async function getMultaState(req, res) {
  try {
    const result = await getMultaStateFlow(req.auth, req.params.multaId);
    return res.json(result);
  } catch (err) {
    return sendServiceError(res, err);
  }
}

export async function getMultaFullState(req, res) {
  try {
    const result = await getMultaFullStateFlow(req.auth, req.params.multaId);
    return res.json(result);
  } catch (err) {
    return sendServiceError(res, err);
  }
}

export async function getDischarge(req, res) {
  try {
    const result = await getDischargeFlow(req.auth, req.params.multaId);
    return res.json(result);
  } catch (err) {
    return sendServiceError(res, err);
  }
}
