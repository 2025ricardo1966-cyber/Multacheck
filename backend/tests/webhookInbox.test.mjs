import assert from "node:assert/strict";
import {
  WEBHOOK_INBOX_STATUS,
} from "../src/billing/webhook.persistence.js";

assert.equal(WEBHOOK_INBOX_STATUS.PENDING, "pending");
assert.equal(WEBHOOK_INBOX_STATUS.PROCESSED, "processed");

console.log("✅ webhook inbox constants OK");
