import crypto from "node:crypto";

const HEADER_KEYS_FOR_FP = [
  "accept",
  "accept-encoding",
  "accept-language",
  "content-type",
  "user-agent",
  "idempotency-key",
];

/**
 * Huella estable por método + ruta relativa al montaje /api + IP + cabeceras seleccionadas.
 * Authorization solo contribuye como presencia/ausencia (no se registra el token).
 *
 * @param {import('express').Request} req
 * @param {string} ip
 */
export function computeGatewayFingerprint(req, ip) {
  const pathPart = req.path ?? "";
  const method = (req.method ?? "GET").toUpperCase();
  const auth = req.headers?.authorization;
  const authBucket =
    typeof auth === "string" && auth.trim().length ? "present" : "absent";

  const headerPairs = [];
  for (const key of HEADER_KEYS_FOR_FP) {
    const v = req.headers?.[key];
    if (typeof v === "string" && v.length) {
      headerPairs.push(`${key}:${v.trim().slice(0, 2048)}`);
    }
  }
  headerPairs.sort();

  const payload = `${method}\n${pathPart}\n${ip}\nauth:${authBucket}\n${headerPairs.join("\n")}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}
