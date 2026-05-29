import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as multaService from "../../src/multas/multa.service.js";
import { processMulta } from "../../src/services/multaservice.js";

describe("Multa Service", () => {
  it("core flow exports exist", () => {
    assert.strictEqual(typeof multaService.createMultaFlow, "function");
    assert.strictEqual(typeof multaService.analyzeAnonymousFlow, "function");
    assert.strictEqual(typeof multaService.createDischargeCheckoutFlow, "function");
  });

  it("processMulta engine is wired (used by multa.service)", () => {
    assert.strictEqual(typeof processMulta, "function");
  });
});
