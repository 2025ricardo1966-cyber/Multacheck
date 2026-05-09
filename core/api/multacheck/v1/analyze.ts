import {
  runMultaCheck,
  type ProductLegalContext,
  type ProductResult,
} from "../../../runMultaCheck";
import { checkRateLimit } from "./rateLimiter";

/**
 * API CONTRACT V1 - IMMUTABLE
 * No modificar esta versión; cambios estructurales requieren v2+.
 */
export type AnalyzeMultaV1Request = Readonly<{
  patente: string;
  provinciaSeleccionada: string | null;
  legalContext: ProductLegalContext;
}>;

export type AnalysisResult = ProductResult;

export type AnalyzeMultaV1Response = Readonly<{
  version: "v1";
  result: AnalysisResult;
  metadata: {
    executionTime: number;
    engineVersion: string;
  };
    }>
  | Readonly<{
      version: "v1";
      error: "RATE_LIMIT_EXCEEDED";
      retryAfter: number;
    }>;

export type AnalyzeMultaV1RuntimeContext = Readonly<{
  ip?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  requestFingerprint?: string | null;
}>;

const ENGINE_VERSION = "v1";

function sanitizeRequest(
  request: AnalyzeMultaV1Request
): AnalyzeMultaV1Request {
  const patente = String(request?.patente ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const provinciaSeleccionada =
    request?.provinciaSeleccionada == null
      ? null
      : String(request.provinciaSeleccionada).trim() || null;

  const legalContext = request?.legalContext;
  return {
    patente,
    provinciaSeleccionada,
    legalContext: {
      role:
        legalContext?.role === "enterprise" || legalContext?.role === "admin"
          ? legalContext.role
          : "public",
      pais: String(legalContext?.pais ?? "AR"),
      ruleset: String(legalContext?.ruleset ?? "AR"),
      intentionProfile: String(
        legalContext?.intentionProfile ?? "administrative_defense_oriented"
      ),
      vocabularyProfile: String(
        legalContext?.vocabularyProfile ?? "argentina_legal_spanish"
      ),
      notificationStatus:
        legalContext?.notificationStatus === "notified" ||
        legalContext?.notificationStatus === "notified_formal" ||
        legalContext?.notificationStatus === "not_notified"
          ? legalContext.notificationStatus
          : null,
    },
  };
}

function buildRateLimitIdentifier(
  request: AnalyzeMultaV1Request,
  context?: AnalyzeMultaV1RuntimeContext
): string {
  if (context?.userId && context.userId.trim()) return `user:${context.userId.trim()}`;
  if (context?.sessionId && context.sessionId.trim()) return `session:${context.sessionId.trim()}`;
  if (context?.ip && context.ip.trim()) return `ip:${context.ip.trim()}`;

  const fingerprint =
    context?.requestFingerprint?.trim() ||
    `${request?.patente ?? ""}|${request?.legalContext?.pais ?? "AR"}|${
      request?.provinciaSeleccionada ?? "NACIONAL"
    }`;
  return `fp:${fingerprint}`;
}

export function analyzeMultaV1(
  request: AnalyzeMultaV1Request,
  context?: AnalyzeMultaV1RuntimeContext
): AnalyzeMultaV1Response {
  const startedAt = Date.now();
  const identifier = buildRateLimitIdentifier(request, context);
  const rateLimit = checkRateLimit(identifier);
  if (!rateLimit.allowed) {
    return {
      version: "v1",
      error: "RATE_LIMIT_EXCEEDED",
      retryAfter: rateLimit.retryAfter,
    };
  }

  const sanitized = sanitizeRequest(request);
  const output = runMultaCheck(
    sanitized.patente,
    sanitized.provinciaSeleccionada,
    sanitized.legalContext
  );

  return {
    version: "v1",
    result: output,
    metadata: {
      executionTime: Date.now() - startedAt,
      engineVersion: ENGINE_VERSION,
    },
  };
}
