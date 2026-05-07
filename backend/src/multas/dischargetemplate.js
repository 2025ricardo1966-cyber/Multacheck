/**
 * Legal Defense Report — single-shot template (no external calls).
 * Traffic light semantics are normalized here for report copy only.
 */

const LIGHT = Object.freeze({
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
});

/** @returns {"GREEN"|"YELLOW"|"RED"} */
export function normalizeTrafficLightForReport(value) {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (v === LIGHT.GREEN || v === LIGHT.YELLOW || v === LIGHT.RED) {
    return v;
  }
  return LIGHT.YELLOW;
}

function sanitizeParagraph(text, maxLen) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function classificationExplanation(light) {
  switch (light) {
    case LIGHT.GREEN:
      return [
        "The indicators associated with this matter suggest that an administrative challenge (impugnación) may be a reasonable avenue to explore,",
        "subject to applicable deadlines, jurisdiction-specific rules, and the completeness of the evidentiary file.",
        "This assessment is probabilistic; it does not predict how the competent authority will rule.",
      ].join(" ");
    case LIGHT.YELLOW:
      return [
        "The indicators suggest material legal uncertainty: relevant facts, formal requirements, or procedural issues may be open",
        "and could materially affect the outcome once the file is examined in depth.",
        "This assessment is indicative only and does not substitute for a review of primary sources and local norms.",
      ].join(" ");
    case LIGHT.RED:
    default:
      return [
        "The indicators suggest a comparatively high likelihood that the enforcement action would be found substantively and formally valid",
        "under ordinary administrative standards, absent unusual documentary or procedural circumstances.",
        "This is not a prediction of outcome; authorities retain discretion and individual cases may vary.",
      ].join(" ");
  }
}

function riskBullets(light, multa) {
  const typeLabel = sanitizeParagraph(multa.type ?? "traffic-related", 120) || "traffic-related";
  const base = [
    `The alleged violation category (${typeLabel}) frames which deadlines, defenses, and evidentiary burdens typically apply in ${sanitizeParagraph(multa.country ?? "the stated jurisdiction", 80)}.`,
  ];
  switch (light) {
    case LIGHT.GREEN:
      return [
        ...base,
        "Formal or substantive irregularities sometimes arise in comparable files; whether they apply here depends on the full record and governing rules.",
        "Procedural timing (notifications, service, and appeal windows) may materially affect available remedies.",
        "Even where grounds exist, authorities may still weigh policy, proportionality, and evidentiary strength.",
      ];
    case LIGHT.YELLOW:
      return [
        ...base,
        "Key facts may remain disputed or underspecified until additional documentation is filed or clarified with the authority.",
        "The balance between negotiated resolution and formal challenge often turns on risk tolerance and cost considerations.",
        "Outcome sensitivity typically increases where norms grant discretion or where mixed evidence is expected.",
      ];
    case LIGHT.RED:
    default:
      return [
        ...base,
        "Where validity indicators predominate, voluntary regularization within legal deadlines may reduce penalties, interest, or ancillary costs where the regime allows.",
        "A formal challenge may still be available in principle, but its expected marginal benefit should be weighed against time and expense.",
        "Any residual uncertainty should be addressed through qualified counsel with access to the complete file.",
      ];
  }
}

function suggestedAction(light) {
  switch (light) {
    case LIGHT.GREEN:
      return [
        "Suggested direction: prioritize evaluating a formal administrative challenge (impugnación), after confirming non-waivable deadlines and admissible evidence under local rules.",
        "Where appropriate, parallel preparation of a negotiated clarification with the authority may be considered; it does not replace analysis of challenge viability.",
      ].join("\n\n");
    case LIGHT.YELLOW:
      return [
        "Suggested direction: consider obtaining or organizing missing documentation, then reassessing between (i) a structured negotiation with the authority and (ii) a formal challenge, depending on how facts crystallize.",
        "Proceed incrementally; avoid irreversible procedural elections until material uncertainties are reduced.",
      ].join("\n\n");
    case LIGHT.RED:
    default:
      return [
        "Suggested direction: where proportionate under applicable rules, payment or voluntary regularization within statutory deadlines may be comparatively efficient.",
        "If a challenge is contemplated, it should be framed narrowly around documented irregularities or exceptional circumstances, with realistic expectations about standards of review.",
      ].join("\n\n");
  }
}

function summaryOfCase(multa) {
  const country = sanitizeParagraph(multa.country ?? "", 80) || "not specified";
  const type = sanitizeParagraph(multa.type ?? "", 120) || "unspecified";
  const raw = multa.rawInput ?? multa.description ?? "";
  const detail = sanitizeParagraph(raw, 900);

  if (detail.length > 0) {
    return [
      `This matter concerns an alleged ${type} violation in ${country}.`,
      `The user-provided narrative, in substance, is as follows: ${detail}`,
      "The summary is descriptive only and may require corroboration in any formal proceeding.",
    ].join(" ");
  }
  return [
    `This matter concerns an alleged ${type} violation in ${country}.`,
    "The factual narrative available at generation time is limited; any formal strategy should be updated once primary documents and notifications are assembled.",
  ].join(" ");
}

function disclaimer() {
  return [
    "Disclaimer",
    "",
    "This Legal Defense Report is informational and educational. It does not constitute legal advice, does not create an attorney-client relationship,",
    "and must not be read as a guarantee, prediction, or assurance of any specific administrative or judicial outcome.",
    "Laws, regulations, and administrative practice change and vary by jurisdiction; qualified local counsel should review the complete file before any decision.",
    "MultaCheck provides probabilistic orientation only; the competent authority decides the case.",
  ].join(" ");
}

/**
 * Builds the persisted Legal Defense Report body (plain text).
 * Structure and section order are invariant across matters.
 *
 * @param {import("@prisma/client").Multa | Record<string, unknown>} multa
 */
export function buildDischargeText(multa) {
  if (!multa || typeof multa.id !== "string" || !multa.id) {
    throw new Error("buildDischargeText: invalid multa record");
  }

  const light = normalizeTrafficLightForReport(multa.trafficLight);
  const country = sanitizeParagraph(multa.country ?? "", 80) || "—";

  const sections = [
    "Legal Defense Report",
    "",
    "Header",
    `Title: Legal Defense Report`,
    `Multa ID: ${multa.id}`,
    `Country: ${country}`,
    "",
    "Summary of Case",
    summaryOfCase(multa),
    "",
    "Legal Classification",
    `Signal: ${light}`,
    classificationExplanation(light),
    "",
    "Risk Assessment",
    ...riskBullets(light, multa).map((b) => `• ${b}`),
    "",
    "Suggested Action",
    suggestedAction(light),
    "",
    disclaimer(),
  ];

  return sections.join("\n");
}
