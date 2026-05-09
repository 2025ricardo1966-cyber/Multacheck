#!/usr/bin/env node
/**
 * Un solo comando: health → register → analyze (JWT solo en memoria).
 * Salida: solo el JSON final de /multa/analyze va a stdout (UTF-8).
 * Progreso y errores van a stderr.
 *
 * Base URL: `resolveOfficialApiBase()` → http://localhost:3000/api (sin simulación de pago).
 */
import { resolveOfficialApiBase } from "./official-api-base.mjs";

const BASE = resolveOfficialApiBase();

const HEALTH_URL = `${BASE}/health`;
const HEALTH_ATTEMPTS = Number(process.env.MULTACHECK_HEALTH_ATTEMPTS || 40);
const HEALTH_DELAY_MS = Number(process.env.MULTACHECK_HEALTH_DELAY_MS || 500);
const FETCH_MS = Number(process.env.MULTACHECK_FETCH_TIMEOUT_MS || 30000);

function stamp() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const registerBody = {
  email: process.env.MULTACHECK_EMAIL || `e2e_${stamp()}@multacheck.test`,
  password: process.env.MULTACHECK_PASSWORD || "TestPass123!",
  companyName: process.env.MULTACHECK_COMPANY || `E2E ${stamp()}`,
  ...(process.env.MULTACHECK_COMPANY_SLUG
    ? { companySlug: process.env.MULTACHECK_COMPANY_SLUG }
    : {}),
};

const analyzeBody = {
  country: process.env.MULTACHECK_COUNTRY || "AR",
  type: process.env.MULTACHECK_TYPE || "velocidad",
  description:
    process.env.MULTACHECK_DESCRIPTION ||
    "Exceso de velocidad en zona urbana con señalización visible",
};

function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), FETCH_MS);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() =>
    clearTimeout(id)
  );
}

async function waitForBackend() {
  let lastErr = "";
  for (let i = 0; i < HEALTH_ATTEMPTS; i++) {
    try {
      const res = await fetchWithTimeout(HEALTH_URL, { method: "GET" });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`respuesta no JSON (${res.status})`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (json && json.ok === true) {
        console.error(`[e2e] Health OK (${HEALTH_URL})`);
        return;
      }
      throw new Error("body.ok !== true");
    } catch (e) {
      lastErr = e.message || String(e);
      console.error(
        `[e2e] Esperando backend… (${i + 1}/${HEALTH_ATTEMPTS}) ${lastErr}`
      );
      await new Promise((r) => setTimeout(r, HEALTH_DELAY_MS));
    }
  }
  throw new Error(
    `No hay backend en ${HEALTH_URL} tras ${HEALTH_ATTEMPTS} intentos: ${lastErr}`
  );
}

async function main() {
  console.error(`[e2e] API ${BASE}`);

  await waitForBackend();

  const regRes = await fetchWithTimeout(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(registerBody),
  });

  const regText = await regRes.text();
  let regJson;
  try {
    regJson = JSON.parse(regText);
  } catch {
    console.error("[e2e] Register respuesta no JSON:", regText.slice(0, 500));
    process.exit(1);
  }

  if (!regRes.ok) {
    console.error(`[e2e] Register HTTP ${regRes.status}:`, regJson);
    process.exit(1);
  }

  const token = regJson.token;
  if (!token || typeof token !== "string") {
    console.error("[e2e] Sin token en register:", regJson);
    process.exit(1);
  }

  console.error(`[e2e] Register OK — JWT ${token.length} chars (memoria)`);

  const anRes = await fetchWithTimeout(`${BASE}/multa/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(analyzeBody),
  });

  const anText = await anRes.text();
  let anJson;
  try {
    anJson = JSON.parse(anText);
  } catch {
    console.error("[e2e] Analyze respuesta no JSON:", anText.slice(0, 2000));
    process.exit(1);
  }

  if (!anRes.ok) {
    console.error(`[e2e] Analyze HTTP ${anRes.status}`);
  }

  process.stdout.write(`${JSON.stringify(anJson, null, 2)}\n`);

  if (!anRes.ok) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[e2e]", e.message || e);
  process.exit(1);
});
