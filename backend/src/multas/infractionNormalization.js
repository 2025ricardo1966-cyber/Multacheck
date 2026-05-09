/**
 * Normalización y canonicalización de entradas de multa (sin lógica de negocio ni scoring).
 * Contratos HTTP y persistencia (requestHash sobre body crudo) permanecen fuera de este módulo.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { multaFlowLog } from "./multa.debuglog.js";
import { publishDomainEvent } from "../application/domainEvents.port.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @typedef {"SPEEDING"|"PARKING_VIOLATION"|"RED_LIGHT"|"OTHER"} CanonicalViolation */

/** @typedef {{ country: string, region: string|null, city: string|null }} NormalizedJurisdiction */

/** @typedef {{ plate: string|null }} NormalizedVehicle */

/**
 * @typedef {{
 *   violationCanonical: CanonicalViolation,
 *   violationLabelForScoring: string,
 *   jurisdiction: NormalizedJurisdiction,
 *   amount: number|null,
 *   currency: string|null,
 *   eventDateUtc: string|null,
 *   vehicle: NormalizedVehicle,
 *   descriptionNormalized: string,
 *   typeRawNormalized: string,
 * }} CanonicalInfraction
 */

function loadSynonymConfig() {
  const configPath = path.join(__dirname, "../../config/infraction-synonyms.json");
  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw);
}

const _config = loadSynonymConfig();

/** longest-first alias list for deterministic substring match */
function buildAliasTable(config) {
  /** @type {{ alias: string, canonical: string }[]} */
  const rows = [];
  const canon = config.canonicalViolations || {};
  for (const [canonical, aliases] of Object.entries(canon)) {
    for (const a of aliases) {
      const alias = String(a).trim().toLowerCase();
      if (alias.length) rows.push({ alias, canonical });
    }
  }
  rows.sort((a, b) => b.alias.length - a.alias.length);
  return rows;
}

const ALIAS_TABLE = buildAliasTable(_config);

const SCORING_BY_CANONICAL = {
  ...(_config.scoringTypeByCanonical || {}),
  OTHER: _config.scoringTypeByCanonical?.OTHER ?? "otros",
};

export function stablePayloadHash(value) {
  const json = stableStringify(value);
  return crypto.createHash("sha256").update(json).digest("hex");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function normalizeWhitespace(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCasingForMatch(text) {
  return String(text ?? "").trim().toLowerCase();
}

/**
 * Parseo numérico tolerante (coma decimal AR / punto miles EN).
 * @param {unknown} raw
 * @returns {number|null}
 */
export function parseLocaleAmount(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/\s/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeCountry(raw) {
  const t = normalizeWhitespace(raw);
  if (!t) return "AR";
  if (/^[a-z]{2}$/i.test(t)) return t.toUpperCase();
  return t;
}

function parseEventDateUtc(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(raw).trim();
  if (!s) return null;

  const isoTry = new Date(s);
  if (!Number.isNaN(isoTry.getTime())) return isoTry.toISOString();

  const dmAr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;
  const m = dmAr.exec(s);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    const yyyy = parseInt(m[3], 10);
    const hh = m[4] != null ? parseInt(m[4], 10) : 12;
    const mi = m[5] != null ? parseInt(m[5], 10) : 0;
    const d = new Date(Date.UTC(yyyy, mm, dd, hh, mi, 0));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return null;
}

function resolveCanonicalViolation(typeRawNorm, descriptionNorm) {
  const haystackType = typeRawNorm;
  for (const row of ALIAS_TABLE) {
    if (haystackType === row.alias || haystackType.includes(row.alias)) {
      return /** @type {CanonicalViolation} */ (row.canonical);
    }
  }
  for (const row of ALIAS_TABLE) {
    if (descriptionNorm.includes(row.alias)) {
      return /** @type {CanonicalViolation} */ (row.canonical);
    }
  }
  return "OTHER";
}

/**
 * @param {Record<string, unknown>|null|undefined} body
 * @returns {{ multaData: Record<string, unknown>, canonical: CanonicalInfraction, validationFlags: string[], observability: { hashBefore: string, hashAfter: string } }}
 */
export function normalizeAnalyzeInput(body) {
  const snapshotBefore = {
    country: body?.country,
    type: body?.type,
    description: body?.description,
    amount: body?.amount,
    currency: body?.currency,
    date: body?.date ?? body?.eventDate ?? body?.fecha,
    patente: body?.patente ?? body?.plate ?? body?.vehiclePlate,
    province: body?.province ?? body?.region,
    city: body?.city ?? body?.ciudad,
  };

  const validationFlags = [];

  const descriptionNormalized = normalizeWhitespace(body?.description ?? "");
  const typeRawNormalized = normalizeCasingForMatch(
    String(body?.type ?? "transito").replace(/_/g, " ")
  );

  if (!descriptionNormalized) {
    validationFlags.push("MISSING_DESCRIPTION");
  }

  const country = normalizeCountry(body?.country);
  if (!normalizeWhitespace(body?.country) && country === "AR") {
    validationFlags.push("COUNTRY_DEFAULTED_AR");
  }

  const canonicalV = resolveCanonicalViolation(typeRawNormalized, descriptionNormalized.toLowerCase());
  const violationLabelForScoring =
    SCORING_BY_CANONICAL[canonicalV] ?? SCORING_BY_CANONICAL.OTHER ?? "otros";

  const amount = parseLocaleAmount(body?.amount);
  const currencyRaw = body?.currency != null ? normalizeWhitespace(body.currency) : null;
  const currency = currencyRaw ? currencyRaw.toUpperCase().slice(0, 3) : null;
  if (body?.amount != null && body.amount !== "" && amount == null) {
    validationFlags.push("UNPARSED_AMOUNT");
  }

  const eventDateUtc = parseEventDateUtc(body?.date ?? body?.eventDate ?? body?.fecha);

  const plateRaw = body?.patente ?? body?.plate ?? body?.vehiclePlate ?? null;
  const plate =
    plateRaw != null && String(plateRaw).trim()
      ? normalizeWhitespace(plateRaw).toUpperCase().replace(/\s+/g, "")
      : null;

  const region =
    body?.province != null && String(body.province).trim()
      ? normalizeWhitespace(body.province)
      : body?.region != null && String(body.region).trim()
        ? normalizeWhitespace(body.region)
        : null;

  const city =
    body?.city != null && String(body.city).trim()
      ? normalizeWhitespace(body.city)
      : body?.ciudad != null && String(body.ciudad).trim()
        ? normalizeWhitespace(body.ciudad)
        : null;

  /** @type {CanonicalInfraction} */
  const canonical = {
    violationCanonical: /** @type {CanonicalViolation} */ (canonicalV),
    violationLabelForScoring,
    jurisdiction: { country, region, city },
    amount,
    currency,
    eventDateUtc,
    vehicle: { plate },
    descriptionNormalized,
    typeRawNormalized,
  };

  const multaData = {
    country,
    type: violationLabelForScoring,
    description: descriptionNormalized,
    ...(amount != null ? { amount } : {}),
    ...(currency ? { currency } : {}),
    ...(eventDateUtc ? { eventDateUtc } : {}),
    ...(plate ? { vehiclePlate: plate } : {}),
  };

  const observability = {
    hashBefore: stablePayloadHash(snapshotBefore),
    hashAfter: stablePayloadHash({
      ...multaData,
      canonicalViolation: canonical.violationCanonical,
    }),
  };

  const logHooks =
    process.env.MULTACHECK_NORMALIZATION_LOG?.trim() === "1" ||
    validationFlags.length > 0 ||
    canonicalV !== "OTHER" ||
    violationLabelForScoring !== typeRawNormalized;

  if (logHooks) {
    multaFlowLog("INFRACTION_NORMALIZATION", {
      hashBefore: observability.hashBefore,
      hashAfter: observability.hashAfter,
      canonicalViolation: canonical.violationCanonical,
      scoringType: violationLabelForScoring,
      validationFlags,
    });
  }

  publishDomainEvent({
    module_source: "multa.normalization",
    type: "infraction.normalize.completed",
    payload: {
      hash_before: observability.hashBefore,
      hash_after: observability.hashAfter,
      canonical_violation: canonical.violationCanonical,
      validation_flag_count: validationFlags.length,
      description_len: descriptionNormalized.length,
    },
  });

  return { multaData, canonical, validationFlags, observability };
}
