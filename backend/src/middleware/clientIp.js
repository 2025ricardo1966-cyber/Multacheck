/**
 * IP del cliente (primer hop en X-Forwarded-For si viene definida).
 * @param {import('express').Request} req
 */
export function clientIp(req) {
  const xf = req.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.ip ?? "unknown";
}
