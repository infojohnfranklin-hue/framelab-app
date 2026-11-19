const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "../lib/prepayment-eligibility.js");

function load() {
  const source = fs.readFileSync(sourcePath, "utf8").replace(/^export\s+/gm, "") +
    "\n({ RELEASE_1_PREPAYMENT_MARKETS, PREPAYMENT_MARKET_ALLOWLIST, hasAnyActivatedPrepaymentMarket, normalizeBuyerType, evaluatePrepaymentEligibility, validateCompletedCheckoutEligibility, getPrepaymentEligibilityMetadata });";
  return vm.runInNewContext(source, { process: { env: {} }, Date }, { timeout: 1000 });
}

const markets = { PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU" };

test("empty server-controlled allowlist rejects eligibility even when environment lists markets", () => {
  const api = load();
  const decision = api.evaluatePrepaymentEligibility({
    billingCountry: "ch",
    declaredCountry: "CH",
    ipCountry: "CH",
    buyerType: "business_registered",
    env: markets,
    now: () => new Date("2026-11-18T10:00:00.125Z"),
  });
  assert.deepEqual(Array.from(api.PREPAYMENT_MARKET_ALLOWLIST), []);
  assert.equal(api.hasAnyActivatedPrepaymentMarket(), false);
  assert.equal(decision.status, "review");
  assert.equal(decision.code, "MARKET_NOT_ACTIVATED");
  assert.throws(() => api.getPrepaymentEligibilityMetadata(decision), (error) => error.safeCode === "PREPAYMENT_ELIGIBILITY_REQUIRED");
});

test("mismatches, missing IP evidence, disabled markets and Canada are not eligible", () => {
  const api = load();
  const input = {
    billingCountry: "CH",
    declaredCountry: "CH",
    ipCountry: "CH",
    buyerType: "consumer",
    env: markets,
  };
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, declaredCountry: "SG" }).status, "review");
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, ipCountry: null }).status, "review");
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, ipCountry: "SG" }).status, "review");
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, buyerType: "unknown" }).status, "review");
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, env: {} }).code, "MARKET_NOT_ACTIVATED");
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, billingCountry: "CA" }).code, "CANADA_SALES_UNAVAILABLE");
  assert.equal(api.evaluatePrepaymentEligibility({ ...input, billingCountry: "US" }).code, "MARKET_NOT_IN_RELEASE_1");
});

test("New Zealand remains in review until its required signal pair is confirmed", () => {
  const api = load();
  const result = api.evaluatePrepaymentEligibility({
    billingCountry: "NZ",
    declaredCountry: "NZ",
    ipCountry: "NZ",
    buyerType: "consumer",
    env: { PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "NZ" },
  });
  assert.equal(result.status, "review");
  assert.equal(result.code, "NZ_RESIDENCE_SIGNAL_PAIR_UNCONFIRMED");
});

test("completed Checkout fails closed while no market is enabled", () => {
  const api = load();
  const session = {
    customer_details: { address: { country: "CH" } },
    metadata: {
      premivateCheckoutFlow: "r1-location-v1",
      premivateEligibilityVersion: "r1-location-v1",
      premivateEligibilityStatus: "approved",
      premivateEligibilityBillingCountry: "CH",
      premivateEligibilityIpCountry: "CH",
      premivateEligibilityCheckedAt: "1970-01-01T00:16:40.500Z",
      premivateEligibilityExpiresAt: "1970-01-01T00:26:40.500Z",
      premivateEligibilityEvidence: "billing_address_country+server_ip_country",
      premivatePrecontractMarketScope: "CH",
      premivateBuyerType: "consumer",
    },
  };
  assert.equal(api.validateCompletedCheckoutEligibility(session, { eventCreated: 1000 }).status, "refund_review");
  assert.equal(api.validateCompletedCheckoutEligibility(session, { eventCreated: 1000 }).code, "LEGACY_CLIENT_FINALIZED_CHECKOUT_UNSUPPORTED");
  assert.equal(api.validateCompletedCheckoutEligibility({
    ...session,
    customer_details: { address: { country: "AU" } },
  }, { eventCreated: 1000 }).status, "refund_review");
});
