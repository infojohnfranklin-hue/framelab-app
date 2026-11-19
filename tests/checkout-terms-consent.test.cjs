const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "../lib/checkout-terms-consent.js");
const eligibilityPath = path.join(__dirname, "../lib/prepayment-eligibility.js");
const terms = Object.fromEntries(["en", "de", "fr"].map((locale) => [locale, {
  terms: { version: "Working draft · test", sections: [] },
}]));
const copy = Object.fromEntries(["en", "de", "fr"].map((locale) => [locale, {
  seller: `seller-${locale}`,
  proDescription: `pro-${locale}`,
  topupDescription: `topup-${locale}`,
  proPayment: `pro-payment-${locale}`,
  topupPayment: `topup-payment-${locale}`,
  performance: `performance-${locale}`,
  cancellation: `cancellation-${locale}`,
}]));

function load() {
  const eligibilitySource = fs.readFileSync(eligibilityPath, "utf8")
    .replace(/^export\s+/gm, "") + "\n({ isPrepaymentMarketActivated });";
  const { isPrepaymentMarketActivated } = vm.runInNewContext(eligibilitySource, {
    process: { env: {} }, Date,
  }, { timeout: 1000 });
  const source = fs.readFileSync(sourcePath, "utf8")
    .replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "")
    .replace(/^export\s+/gm, "") +
    "\n({ createCheckoutTermsConsent, checkoutTermsMetadata });";
  return vm.runInNewContext(source, {
    LEGAL_DOCUMENTS: terms,
    CHECKOUT_PRECONTRACT_COPY: copy,
    CONTRACT_CONFIRMATION_VERSION: "test-v1",
    isPrepaymentMarketActivated,
    process: { env: {} },
    Date,
  }, { timeout: 1000 });
}

function validInput(overrides = {}) {
  return {
    accepted: true,
    locale: "fr",
    marketCountryScope: "CH",
    marketRegion: "",
    buyerType: "consumer",
    frenchVersionPresented: false,
    alternativeLanguageChoice: false,
    env: { VERCEL_ENV: "preview", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU" },
    now: () => new Date("2026-11-17T10:00:00.000Z"),
    ...overrides,
  };
}

test("environment configuration cannot open a paid market while the server capture gate is incomplete", () => {
  const api = load();
  for (const marketCountryScope of ["CH", "SG", "AU", "NZ"]) {
    assert.throws(
      () => api.createCheckoutTermsConsent(validInput({
        marketCountryScope,
        env: { VERCEL_ENV: "preview", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU,NZ" },
      })),
      (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
      `Expected ${marketCountryScope} to stay closed despite environment configuration`,
    );
  }
});

test("all Canadian provinces and territories are unavailable before checkout", () => {
  const api = load();
  for (const marketRegion of ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]) {
    assert.throws(
      () => api.createCheckoutTermsConsent(validInput({
        marketCountryScope: "CA",
        marketRegion,
        frenchVersionPresented: marketRegion === "QC",
        alternativeLanguageChoice: false,
      })),
      (error) => error.status === 403 && error.safeCode === "CANADA_SALES_UNAVAILABLE",
      `Expected ${marketRegion} to be denied`,
    );
  }
});

test("empty allowlist blocks Checkout Sessions in preview and production", () => {
  const api = load();
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({
      env: { VERCEL_ENV: "preview", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "" },
    })),
    (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
  );
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({
      marketCountryScope: "NZ",
      env: { VERCEL_ENV: "preview", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "NZ" },
    })),
    (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
  );
});

test("closed markets stay unavailable and Canadian declarations reject invalid regions", () => {
  const api = load();
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({ marketCountryScope: "CH", marketRegion: "", frenchVersionPresented: true })),
    (error) => error.safeCode === "MARKET_NOT_ACTIVATED",
  );
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({ marketCountryScope: "CA", marketRegion: "XX" })),
    (error) => error.safeCode === "PRECONTRACT_MARKET_REGION_INVALID",
  );
});

test("production environment cannot bypass the empty market allowlist", () => {
  const api = load();
  for (const locale of ["en", "de", "fr"]) {
    assert.throws(
      () => api.createCheckoutTermsConsent(validInput({
        locale,
        marketCountryScope: "CH",
        marketRegion: "",
        frenchVersionPresented: false,
        alternativeLanguageChoice: false,
        env: { VERCEL_ENV: "production", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU" },
      })),
      (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
    );
  }
});
