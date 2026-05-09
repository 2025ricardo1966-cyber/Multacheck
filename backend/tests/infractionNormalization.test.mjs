import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeAnalyzeInput,
  normalizeWhitespace,
  parseLocaleAmount,
  stablePayloadHash,
} from "../src/multas/infractionNormalization.js";

describe("infractionNormalization", () => {
  it("normaliza sin efectos colaterales determinísticos (ej. exceso → velocidad)", () => {
    const { multaData, canonical, observability } = normalizeAnalyzeInput({
      country: "AR",
      type: "exceso_velocidad",
      description: "Multa en Av. Corrientes",
    });
    assert.equal(multaData.type, "velocidad");
    assert.equal(canonical.violationCanonical, "SPEEDING");
    assert.equal(multaData.country, "AR");
    assert.match(multaData.description, /Corrientes/);
    assert.match(observability.hashBefore, /^[a-f0-9]{64}$/);
    assert.match(observability.hashAfter, /^[a-f0-9]{64}$/);
    assert.notEqual(observability.hashBefore, observability.hashAfter);
  });

  it("resuelve estacionamiento desde descripción", () => {
    const { multaData, canonical } = normalizeAnalyzeInput({
      country: "AR",
      type: "transito",
      description: "Me multaron por doble fila en Palermo",
    });
    assert.equal(canonical.violationCanonical, "PARKING_VIOLATION");
    assert.equal(multaData.type, "estacionamiento");
  });

  it("parseLocaleAmount acepta coma decimal", () => {
    assert.equal(parseLocaleAmount("12.345,50"), 12345.5);
    assert.equal(parseLocaleAmount("1000"), 1000);
    assert.equal(parseLocaleAmount(""), null);
  });

  it("normalizeWhitespace colapsa espacios", () => {
    assert.equal(normalizeWhitespace("  a \n\n b  "), "a b");
  });

  it("stablePayloadHash es estable ante orden de claves", () => {
    const a = stablePayloadHash({ z: 1, a: 2 });
    const b = stablePayloadHash({ a: 2, z: 1 });
    assert.equal(a, b);
  });

  it("marca MISSING_DESCRIPTION sin rechazar (solo flags)", () => {
    const { validationFlags } = normalizeAnalyzeInput({
      country: "AR",
      type: "velocidad",
      description: "",
    });
    assert.ok(validationFlags.includes("MISSING_DESCRIPTION"));
  });
});
