const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function loadEligibility() {
  const source = fs.readFileSync(path.join(root, "lib/server-finalized-eligibility.js"), "utf8")
    .replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "")
    .replace(/^export\s+/gm, "") +
    "\n({ SERVER_FINALIZED_CHECKOUT_FLOW, validateServerFinalizedEligibilityMetadata });";
  const normalizeBuyerType = (value) => ["consumer", "business_registered", "business_unregistered", "business_unknown"].includes(value) ? value : null;
  const isPrepaymentMarketActivated = (country) => country === "CH";
  return vm.runInNewContext(source, { normalizeBuyerType, isPrepaymentMarketActivated, Date }, { timeout: 1000 });
}

function metadata(overrides = {}) {
  return {
    premivateCheckoutFlow: "r2-server-finalized-v1",
    premivateEligibilityVersion: "r2-server-finalized-v1",
    premivateEligibilityStatus: "approved",
    premivateEligibilityBillingCountry: "CH",
    premivateEligibilityIpCountry: "CH",
    premivateEligibilityEvidence: "confirmation_token_billing_country+server_ip_country",
    premivateEligibilityCheckedAt: "2026-11-18T10:00:00.000Z",
    premivateEligibilityExpiresAt: "2026-11-18T10:10:00.000Z",
    premivatePrecontractMarketScope: "CH",
    premivateBuyerType: "consumer",
    ...overrides,
  };
}

test("server-finalized payment metadata validates only within the captured eligibility window", () => {
  const api = loadEligibility();
  const result = api.validateServerFinalizedEligibilityMetadata(metadata(), {
    eventCreated: Date.parse("2026-11-18T10:05:00.000Z") / 1000,
    now: () => new Date("2026-11-18T10:05:00.000Z"),
  });
  assert.equal(api.SERVER_FINALIZED_CHECKOUT_FLOW, "r2-server-finalized-v1");
  assert.equal(result.status, "eligible");
  assert.equal(result.billingCountry, "CH");
  assert.equal(result.buyerType, "consumer");
});

test("initial payment fails closed on expired, mismatched, legacy, or unavailable market evidence", () => {
  const api = loadEligibility();
  const at = Date.parse("2026-11-18T10:11:00.000Z") / 1000;
  assert.equal(api.validateServerFinalizedEligibilityMetadata(metadata(), { eventCreated: at }).status, "refund_review");
  assert.equal(api.validateServerFinalizedEligibilityMetadata(metadata({ premivateEligibilityIpCountry: "SG" })).status, "refund_review");
  assert.equal(api.validateServerFinalizedEligibilityMetadata(metadata({ premivatePrecontractMarketScope: "SG" })).status, "refund_review");
  assert.equal(api.validateServerFinalizedEligibilityMetadata(metadata({ premivateCheckoutFlow: "r1-location-v1" })).status, "refund_review");
  assert.equal(api.validateServerFinalizedEligibilityMetadata(metadata({
    premivateEligibilityExpiresAt: "2026-11-18T10:11:00.000Z",
  })).status, "refund_review");
});

test("recurring invoices can validate their original evidence without requiring the market to remain open for new sales", () => {
  const api = loadEligibility();
  const result = api.validateServerFinalizedEligibilityMetadata(metadata({
    premivateEligibilityExpiresAt: "2026-11-18T10:11:00.000Z",
  }), { enforceExpiry: false, requireActivated: false });
  assert.equal(result.status, "eligible");
});

test("Pro and top-up entry routes no longer create Checkout Sessions or expose client secrets", () => {
  for (const route of ["pages/api/create-checkout-session.js", "pages/api/create-credit-topup-session.js"]) {
    const source = fs.readFileSync(path.join(root, route), "utf8");
    assert.match(source, /createServerFinalizedPrepaymentDraft/);
    assert.doesNotMatch(source, /checkout\.sessions\.create/);
    assert.doesNotMatch(source, /clientSecret/);
  }
  const finalizer = fs.readFileSync(path.join(root, "lib/server-finalized-prepayment.js"), "utf8");
  assert.ok(finalizer.indexOf("stripe.confirmationTokens.retrieve") < finalizer.indexOf("stripe.paymentIntents.create"));
  assert.ok(finalizer.indexOf("stripe.confirmationTokens.retrieve") < finalizer.indexOf("stripe.paymentIntents.confirm"));
  assert.match(fs.readFileSync(path.join(root, "pages/api/prepayment-eligibility.js"), "utf8"), /status\(410\)/);
  const dialog = fs.readFileSync(path.join(root, "components/StripePrepaymentDialog.js"), "utf8");
  assert.match(dialog, /createConfirmationToken/);
  assert.match(dialog, /\/api\/finalize-prepayment/);
  assert.doesNotMatch(dialog, /actionsRef\.current\.confirm/);
});
