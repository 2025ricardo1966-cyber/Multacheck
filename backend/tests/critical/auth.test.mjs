import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { login, register } from "../../src/auth/auth.service.js";
import {
  resolveTenantSlug,
  slugFromCompanyName,
  sanitizeTenantSlug,
} from "../../src/auth/auth.slug.js";

describe("Auth Service", () => {
  it("login and register should be exported functions", () => {
    assert.strictEqual(typeof login, "function");
    assert.strictEqual(typeof register, "function");
  });

  it("register should derive predictable slug from company name", () => {
    assert.strictEqual(slugFromCompanyName("My Company"), "my-company");
    assert.strictEqual(sanitizeTenantSlug("  My-Company!  "), "my-company");
    assert.strictEqual(resolveTenantSlug("My Company", ""), "my-company");
    assert.strictEqual(resolveTenantSlug("My Company", "custom-slug"), "custom-slug");
    assert.strictEqual(resolveTenantSlug("Acme Corp", "  "), "acme-corp");
  });
});
