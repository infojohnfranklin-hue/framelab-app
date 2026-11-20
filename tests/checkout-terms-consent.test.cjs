const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "../lib/checkout-terms-consent.js");
const eligibilityPath = path.join(__dirname, "../lib/prepayment-eligibility.js");
const terms = Object.fromEntries(["en", "de", "fr"].map((locale) => [locale, {
  terms: { version: "v5 · test", sections: [] },
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

test("CH is enabled, but environment configuration cannot activate other markets", () => {
  const api = load();
  for (const marketCountryScope of ["SG", "AU", "NZ"]) {
    assert.throws(
      () => api.createCheckoutTermsConsent(validInput({
        marketCountryScope,
        env: { VERCEL_ENV: "preview", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU,NZ" },
      })),
      (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
      `Expected ${marketCountryScope} to stay closed despite environment configuration`,
    );
  }
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({
      marketCountryScope: "CH",
      env: { VERCEL_ENV: "preview", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH" },
    })),
    (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
  );
  const consent = api.createCheckoutTermsConsent(validInput({
    marketCountryScope: "CH",
    env: { VERCEL_ENV: "production", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU,NZ" },
  }));
  assert.equal(consent.accepted, true);
  assert.equal(consent.precontractDisclosure.marketCountryScope, "CH");
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

test("inactive markets block Checkout Sessions in preview and production", () => {
  const api = load();
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({
      marketCountryScope: "SG",
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
    () => api.createCheckoutTermsConsent(validInput({ marketCountryScope: "SG", marketRegion: "", frenchVersionPresented: true })),
    (error) => error.safeCode === "MARKET_NOT_ACTIVATED",
  );
  assert.throws(
    () => api.createCheckoutTermsConsent(validInput({ marketCountryScope: "CA", marketRegion: "XX" })),
    (error) => error.safeCode === "PRECONTRACT_MARKET_REGION_INVALID",
  );
});

test("production environment cannot activate SG, AU, or NZ", () => {
  const api = load();
  for (const marketCountryScope of ["SG", "AU", "NZ"]) {
    assert.throws(
      () => api.createCheckoutTermsConsent(validInput({
        marketCountryScope,
        marketRegion: "",
        frenchVersionPresented: false,
        alternativeLanguageChoice: false,
        env: { VERCEL_ENV: "production", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "CH,SG,AU,NZ" },
      })),
      (error) => error.status === 403 && error.safeCode === "MARKET_NOT_ACTIVATED",
    );
  }
  const swissConsent = api.createCheckoutTermsConsent(validInput({
    locale: "en",
    marketCountryScope: "CH",
    marketRegion: "",
    frenchVersionPresented: false,
    alternativeLanguageChoice: false,
    env: { VERCEL_ENV: "production", PREMIVATE_PREPAYMENT_ELIGIBILITY_MARKETS: "SG,AU,NZ" },
  }));
  assert.equal(swissConsent.precontractDisclosure.marketCountryScope, "CH");
});
