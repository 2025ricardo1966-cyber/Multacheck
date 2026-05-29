import assert from "node:assert/strict";
import { describe, it } from "node:test";
import planRoutes from "../../src/plans/plan.routes.js";

describe("MVP API surface", () => {
  it("public plans router is configured", () => {
    assert.strictEqual(typeof planRoutes, "function");
    assert.ok(planRoutes.stack?.length > 0);
  });
});
