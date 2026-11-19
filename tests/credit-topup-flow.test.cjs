const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");

function loadMarketDataParameters() {
  let source = fs.readFileSync(path.join(root, "lib/stripe-market-data.js"), "utf8")
    .replace(/^export\s+/gm, "");
  return vm.runInNewContext(`${source}\n({ CHECKOUT_MARKET_DATA_PARAMETERS });`, {}, { timeout: 1000 })
    .CHECKOUT_MARKET_DATA_PARAMETERS;
}
const CHECKOUT_MARKET_DATA_PARAMETERS = loadMarketDataParameters();

function loadModule(file, bindings = {}) {
  let source = fs.readFileSync(path.join(root, file), "utf8");
  source = source.replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "");
  source = source.replace(/^export\s+(?=(?:async\s+)?function|const|class)/gm, "");
  source = source.replace(/(^|\n)export default async function handler/g, "$1async function handler");
  const defaults = {
    CHECKOUT_MARKET_DATA_PARAMETERS,
    validateServerFinalizedEligibilityMetadata: undefined,
    SERVER_FINALIZED_CHECKOUT_FLOW: undefined,
    createCheckoutTermsConsent: ({ locale = "en", accepted = true, ...input }) => {
      if (input.marketCountryScope === "CA") {
        const error = new Error("CANADA_SALES_UNAVAILABLE");
        error.status = 403;
        error.safeCode = "CANADA_SALES_UNAVAILABLE";
        throw error;
      }
      return {
        accepted, locale, version: "terms-v1", acceptedAt: "2026-11-17T10:00:00.000Z",
        precontractDisclosure: {
          marketCountryScope: input.marketCountryScope || "OTHER",
          marketRegion: input.marketRegion || "",
          buyerType: input.buyerType || "consumer",
          frenchVersionPresented: input.frenchVersionPresented === true,
          alternativeLanguageChoice: input.alternativeLanguageChoice === true,
        },
      };
    },
    checkoutTermsMetadata: (consent) => ({
      premivateTermsVersion: consent.version,
      premivateTermsLocale: consent.locale,
      premivateTermsAcceptedAt: consent.acceptedAt,
      premivatePrecontractMarketScope: consent.precontractDisclosure.marketCountryScope,
      premivatePrecontractRegion: consent.precontractDisclosure.marketRegion,
      premivateBuyerType: consent.precontractDisclosure.buyerType,
      premivateFrenchTermsPresented: String(consent.precontractDisclosure.frenchVersionPresented),
      premivateAlternativeLanguageChoice: String(consent.precontractDisclosure.alternativeLanguageChoice),
    }),
    earlyStartRequestMetadata: ({ confirmationId, requested }) => ({
      premivateContractConfirmationId: confirmationId,
      premivateEarlyStartRequested: String(requested),
      premivateEarlyStartVersion: "test-v1",
    }),
    createContractConfirmationDraft: async (_db, input) => ({
      id: "confirmation-test-1",
      earlyStartRequested: input.earlyStartRequested,
      earlyStartRequestedAt: null,
    }),
    attachContractConfirmationSession: async () => true,
    markContractConfirmationCheckoutFailed: async () => {},
    persistCheckoutMarketData: async () => ({ status: "not_collected" }),
    handler: undefined, isCreditLedgerEnabled: undefined, parseCreditBalance: undefined,
    readCreditBalance: undefined, isTopupSalesEnabled: undefined,
    getCreditTopupPackage: undefined, validateTopupBalance: undefined,
    createCreditTopupCheckout: undefined, processPaidCreditTopup: undefined,
    assertAccountNotDeleting: async () => true,
    isAccountDeletionMarked: async () => false,
    getStripeBaseUrl: () => null,
    getStripePublishableKey: () => null,
    getEffectiveUserPlan: undefined, isProPlan: undefined,
    isPremivateOwner: (id) => id === "user_3DrEzh71zs0gCqttVokYBfwF6Jk",
    stripeSecretMatchesEnvironment: (env) => typeof env?.STRIPE_SECRET_KEY === "string" &&
      (env.VERCEL_ENV === "production" ? env.STRIPE_SECRET_KEY.startsWith("sk_live_") : env.STRIPE_SECRET_KEY.startsWith("sk_test_")),
    stripeEventMatchesEnvironment: (event, env) => typeof event?.livemode === "boolean" &&
      event.livemode === (env.VERCEL_ENV === "production") &&
      (env.VERCEL_ENV === "production" ? env.STRIPE_SECRET_KEY?.startsWith("sk_live_") : env.STRIPE_SECRET_KEY?.startsWith("sk_test_")),
  };
  const wrapped = `${source}\n({ handler, getEffectiveUserPlan, isCreditLedgerEnabled, isProPlan, parseCreditBalance, readCreditBalance, isTopupSalesEnabled, getCreditTopupPackage, validateTopupBalance, createCreditTopupCheckout, processPaidCreditTopup, validateServerFinalizedEligibilityMetadata, SERVER_FINALIZED_CHECKOUT_FLOW });`;
  return vm.runInNewContext(wrapped, { ...defaults, ...bindings, console, URL, process: bindings.process || { env: {} }, Buffer }, { timeout: 1000 });
}

const enabledEnv = {
  PREMIVATE_TOPUP_SALES_ENABLED: "true",
  PREMIVATE_CREDIT_LEDGER_BALANCE_ENABLED: "true",
  PREMIVATE_PRO_CREDIT_LEDGER_ENABLED: "true",
  PREMIVATE_PRO_TEXT_BLUEPRINT_CREDIT_LEDGER_ENABLED: "true",
  STRIPE_SECRET_KEY: "sk_test_offline",
  STRIPE_WEBHOOK_SECRET: "whsec_offline",
  NODE_ENV: "test",
  VERCEL_ENV: "preview",
};
const validBalance = { subscriptionAvailable: 10, subscriptionHeld: 0, purchasedAvailable: 2, purchasedHeld: 0 };

test("top-up sales are closed by default and package IDs reject inherited properties", () => {
  const api = loadModule("lib/credit-topup.js");
  assert.equal(api.isTopupSalesEnabled({}), false);
  assert.equal(api.getCreditTopupPackage("credits_25").amount, 690);
  assert.equal(api.getCreditTopupPackage("toString"), null);
  assert.equal(api.getCreditTopupPackage("__proto__"), null);
});

test("sales-off checkout is rejected before any Stripe session factory runs", async () => {
  const api = loadModule("lib/credit-topup.js");
  let sessions = 0;
  await assert.rejects(api.createCreditTopupCheckout({
    env: {}, userId: "user_pro", packageId: "credits_25",
    getPlan: async () => "pro", getBalance: async () => validBalance,
    createSession: async () => { sessions++; return { url: "https://checkout.test/x" }; },
    baseUrl: "https://premivate.com",
  }), (error) => error.status === 503);
  assert.equal(sessions, 0);
});

test("unconfigured top-up route imports and rejects without constructing Stripe", async () => {
  let stripeInstances = 0;
  const creditTopup = loadModule("lib/credit-topup.js");
  const api = loadModule("pages/api/create-credit-topup-session.js", {
    Stripe: class { constructor() { stripeInstances++; throw new Error("must not initialize"); } },
    getAuth: () => ({ userId: "user_pro" }),
    getEffectiveUserPlan: async () => "pro",
    getStripeCustomerIdStrict: async () => null,
    isProPlan: () => true,
    supabase: {},
    readCreditBalance: async () => validBalance,
    createCreditTopupCheckout: creditTopup.createCreditTopupCheckout,
    process: { env: {} },
  });
  const response = responseStub();
  await api.handler({ method: "POST", body: { packageId: "credits_25" } }, response);
  assert.equal(response.code, 503);
  assert.equal(stripeInstances, 0);
});

test("subscription checkout route import does not initialize Stripe before its runtime guard", () => {
  let stripeInstances = 0;
  loadModule("pages/api/create-checkout-session.js", {
    Stripe: class { constructor() { stripeInstances++; throw new Error("must stay lazy"); } },
    getAuth: () => ({ userId: null }),
    process: { env: {} },
  });
  assert.equal(stripeInstances, 0);
});

test("shared effective-plan helper preserves Owner Pro and reads regular Pro from the existing plan source", async () => {
  const api = loadModule("lib/pro.js", {
    createClient: () => ({
      from: () => ({
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({ data: { plan: "pro" }, error: null }),
      }),
    }),
  });
  assert.equal(await api.getEffectiveUserPlan("user_3DrEzh71zs0gCqttVokYBfwF6Jk"), "pro");
  assert.equal(await api.getEffectiveUserPlan("user_regular_pro"), "pro");
  assert.equal(api.isProPlan("PRO"), true);
  assert.equal(api.isProPlan("free"), false);
});

test("balance RPC rejects missing, negative, incomplete and non-object balances", () => {
  const api = loadModule("lib/credit-balance.js");
  for (const data of [null, [], {}, { ...validBalance, purchasedHeld: -1 }, { ...validBalance, subscriptionAvailable: 201 }]) {
    assert.throws(() => api.parseCreditBalance(data), /CREDIT_BALANCE_INVALID/);
  }
});

test("legacy Redis errors keep HTTP 500", async () => {
  const api = loadModule("pages/api/credits.js", {
    getAuth: () => ({ userId: "user_pro" }),
    FREE_CREDIT_LIMIT: 2,
    getCreditSnapshot: async () => { throw new Error("redis down"); },
    getEffectiveUserPlan: async () => "pro",
    isCreditLedgerEnabled: () => false,
    isTopupSalesEnabled: () => false,
    readCreditBalance: async () => validBalance,
    supabase: {},
    process: { env: {} },
  });
  const response = responseStub();
  await api.handler({ method: "GET" }, response);
  assert.equal(response.code, 500);
});

test("Free balances keep the existing Redis values and do not read the ledger", async () => {
  let ledgerReads = 0;
  const api = loadModule("pages/api/credits.js", {
    getAuth: () => ({ userId: "user_free" }),
    FREE_CREDIT_LIMIT: 2,
    getCreditSnapshot: async () => ({ used: 1, reserved: 0, remaining: 1 }),
    getEffectiveUserPlan: async () => "free",
    isCreditLedgerEnabled: () => true,
    isTopupSalesEnabled: () => false,
    readCreditBalance: async () => { ledgerReads++; return validBalance; },
    supabase: {}, process: { env: {} },
  });
  const response = responseStub();
  await api.handler({ method: "GET" }, response);
  assert.equal(response.code, 200);
  assert.equal(response.body.used, 1);
  assert.equal(response.body.remaining, 1);
  assert.equal(response.body.ledgerEnabled, true);
  assert.equal(response.body.purchasedAvailable, validBalance.purchasedAvailable);
  assert.equal(ledgerReads, 1);
});

test("enabled Pro ledger read errors keep HTTP 503", async () => {
  const api = loadModule("pages/api/credits.js", {
    getAuth: () => ({ userId: "user_pro" }),
    FREE_CREDIT_LIMIT: 2,
    getCreditSnapshot: async () => ({ used: 0, reserved: 0, remaining: 2 }),
    getEffectiveUserPlan: async () => "pro",
    isCreditLedgerEnabled: () => true,
    isTopupSalesEnabled: () => true,
    readCreditBalance: async () => { throw new Error("ledger down"); },
    supabase: {},
    process: { env: {} },
  });
  const response = responseStub();
  await api.handler({ method: "GET" }, response);
  assert.equal(response.code, 503);
});

test("Free users cannot create top-up checkout sessions", async () => {
  const api = loadModule("lib/credit-topup.js");
  let sessions = 0;
  await assert.rejects(api.createCreditTopupCheckout({
    env: enabledEnv, userId: "user_free", packageId: "credits_25",
    getPlan: async () => "free", getBalance: async () => validBalance,
    getCustomerId: async () => "cus_test",
    createSession: async () => { sessions++; return { url: "https://checkout.test/x" }; },
    baseUrl: "https://premivate.com",
  }), (error) => error.status === 403);
  assert.equal(sessions, 0);
});

test("TEST B: malformed or failed balance prevents a Stripe session", async () => {
  const api = loadModule("lib/credit-topup.js");
  for (const getBalance of [
    async () => ({ ...validBalance, purchasedAvailable: -1 }),
    async () => ({ subscriptionAvailable: 0 }),
    async () => { throw new Error("RPC failure"); },
  ]) {
    let sessions = 0;
    await assert.rejects(api.createCreditTopupCheckout({
      env: enabledEnv, userId: "user_pro", packageId: "credits_25",
      getPlan: async () => "pro", getBalance,
      getCustomerId: async () => "cus_test",
      createSession: async () => { sessions++; return { url: "https://checkout.test/x" }; },
      baseUrl: "https://premivate.com",
    }), (error) => error.status === 503);
    assert.equal(sessions, 0);
  }
});

test("server-owned package amount is used for the top-up Checkout session", async () => {
  const api = loadModule("lib/credit-topup.js");
  let params;
  const result = await api.createCreditTopupCheckout({
    env: enabledEnv, userId: "user_pro", packageId: "credits_50",
    termsAccepted: true, termsLocale: "en", earlyStartRequested: false,
    marketCountryScope: "CH", marketRegion: "", buyerType: "consumer",
    frenchVersionPresented: false, alternativeLanguageChoice: false,
    getPlan: async () => "pro", getBalance: async () => validBalance,
    getCustomerId: async () => "cus_test",
    createSession: async (value) => { params = value; return { id: "cs_test_session", ui_mode: "elements", client_secret: "cs_test_secret", expires_at: 1_900_000_000 }; },
    baseUrl: "https://premivate.com",
  });
  assert.equal(result.sessionId, "cs_test_session");
  assert.equal(result.clientSecret, "cs_test_secret");
  assert.equal(params.ui_mode, "elements");
  assert.match(params.return_url, /\/success\?session_id=\{CHECKOUT_SESSION_ID\}$/);
  assert.equal(params.line_items[0].price_data.unit_amount, 1290);
  assert.equal(params.line_items[0].price_data.currency, "chf");
  assert.equal(params.metadata.credits, "50");
  assert.equal(params.customer, "cus_test");
  assert.equal(params.locale, "en");
  assert.equal(params.metadata.premivatePrecontractRegion, "");
  assert.equal(params.metadata.premivateBuyerType, "consumer");
  assert.equal(params.custom_fields, undefined);
});

test("Canadian top-up checkout is denied before plan, customer or Stripe lookups", async () => {
  const api = loadModule("lib/credit-topup.js");
  const calls = { plan: 0, balance: 0, customer: 0, session: 0 };
  await assert.rejects(api.createCreditTopupCheckout({
    env: enabledEnv,
    userId: "user_pro",
    packageId: "credits_25",
    termsAccepted: true,
    termsLocale: "en",
    earlyStartRequested: false,
    marketCountryScope: "CA",
    marketRegion: "ON",
    frenchVersionPresented: false,
    alternativeLanguageChoice: false,
    getPlan: async () => { calls.plan++; return "pro"; },
    getBalance: async () => { calls.balance++; return validBalance; },
    getCustomerId: async () => { calls.customer++; return "cus_test"; },
    createSession: async () => { calls.session++; return { url: "https://checkout.test/session" }; },
    baseUrl: "https://premivate.com",
  }), (error) => error.status === 403 && error.safeCode === "CANADA_SALES_UNAVAILABLE");
  assert.deepEqual(calls, { plan: 0, balance: 0, customer: 0, session: 0 });
});

test("Owner cannot purchase top-ups because Owner access is unlimited", async () => {
  const api = loadModule("lib/credit-topup.js");
  let sessions = 0;
  await assert.rejects(api.createCreditTopupCheckout({
    env: enabledEnv, userId: "user_3DrEzh71zs0gCqttVokYBfwF6Jk", packageId: "credits_25",
    getPlan: async () => "pro", getBalance: async () => validBalance,
    getCustomerId: async () => "cus_test",
    createSession: async () => { sessions++; return { url: "https://checkout.test/x" }; },
    baseUrl: "https://premivate.com",
  }), (error) => error.status === 403);
  assert.equal(sessions, 0);
});

test("server-finalized top-up payment is recorded from the verified PaymentIntent", async () => {
  const now = Date.now();
  const checkedAt = new Date(now - 60_000).toISOString();
  const expiresAt = new Date(now + 9 * 60_000).toISOString();
  const metadata = {
    premivateCheckoutFlow: "r2-server-finalized-v1",
    premivateCheckoutType: "credit_topup",
    premivateEligibilityVersion: "r2-server-finalized-v1",
    premivateEligibilityStatus: "approved",
    premivateEligibilityBillingCountry: "CH",
    premivateEligibilityIpCountry: "CH",
    premivateEligibilityEvidence: "confirmation_token_billing_country+server_ip_country",
    premivateEligibilityCheckedAt: checkedAt,
    premivateEligibilityExpiresAt: expiresAt,
    premivatePrecontractMarketScope: "CH",
    premivateBuyerType: "consumer",
    premivateContractConfirmationId: "confirmation-test-1",
    premivateEarlyStartRequested: "false",
    premivateEarlyStartVersion: "eu-service-confirmation-v2",
    premivateTermsVersion: "terms-v1",
    premivateTermsLocale: "en",
    premivateTermsAcceptedAt: checkedAt,
    clerkUserId: "user_pro",
    creditPackage: "credits_25",
    credits: "25",
  };
  const event = {
    id: "evt_server_topup_1",
    type: "payment_intent.succeeded",
    created: Math.floor(now / 1000),
    livemode: false,
    data: { object: { id: "pi_server_topup_1", metadata } },
  };
  const paymentIntent = {
    id: "pi_server_topup_1",
    status: "succeeded",
    amount: 690,
    amount_received: 690,
    currency: "chf",
    livemode: false,
    customer: { id: "cus_server_topup_1" },
    payment_method: {
      id: "pm_server_topup_1",
      type: "card",
      billing_details: { address: { country: "CH" } },
    },
    metadata,
  };
  const confirmation = {
    id: "confirmation-test-1",
    clerk_user_id: "user_pro",
    service_type: "credit_topup",
    state: "checkout_pending",
    purchase_snapshot: { packageId: "credits_25", credits: 25, amount: 690 },
    stripe_confirmation_token_id: "ctoken_test_1",
    stripe_payment_intent_id: null,
    stripe_customer_id: "cus_server_topup_1",
  };
  let recorded;
  const supabase = {
    from(table) {
      assert.equal(table, "premivate_contract_confirmations");
      const query = {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: confirmation, error: null }; },
      };
      return query;
    },
  };
  const eligibility = loadModule("lib/server-finalized-eligibility.js", {
    normalizeBuyerType: (value) => value,
    isPrepaymentMarketActivated: () => false,
  });
  const api = loadModule("lib/credit-topup.js", {
    validateServerFinalizedEligibilityMetadata: eligibility.validateServerFinalizedEligibilityMetadata,
    SERVER_FINALIZED_CHECKOUT_FLOW: eligibility.SERVER_FINALIZED_CHECKOUT_FLOW,
    grantPurchasedCredits: async () => { throw new Error("server-finalized top-ups must remain transfer-gated"); },
    recordPaidServerFinalizedContractConfirmation: async (_db, input) => { recorded = input; },
  });
  assert.equal(metadata.premivateCheckoutFlow, eligibility.SERVER_FINALIZED_CHECKOUT_FLOW);
  assert.equal(event.data.object.metadata.premivateCheckoutType, "credit_topup");
  const result = await api.processPaidCreditTopup({
    event,
    stripe: {
      paymentIntents: { retrieve: async (id) => { assert.equal(id, paymentIntent.id); return paymentIntent; } },
      customers: { retrieve: async (id) => ({ id, address: { country: "CH" }, email: "buyer@example.test" }) },
    },
    supabase,
    env: { VERCEL_ENV: "preview" },
  });
  assert.equal(result.status, "paid_pending_transfer");
  assert.equal(recorded.paymentIntent.id, paymentIntent.id);
  assert.equal(recorded.expectedServiceType, "credit_topup");
  assert.equal(recorded.marketData.billingCountry, "CH");
});

test("refund-restricted Pro accounts cannot start a new top-up checkout", async () => {
  const api = loadModule("lib/credit-topup.js");
  let sessions = 0;
  await assert.rejects(api.createCreditTopupCheckout({
    env: enabledEnv, userId: "user_restricted", packageId: "credits_25",
    getPlan: async () => "pro",
    getBalance: async () => ({ ...validBalance, creditAccessBlocked: true }),
    getCustomerId: async () => "cus_test",
    createSession: async () => { sessions++; return { url: "https://checkout.test/x" }; },
    baseUrl: "https://premivate.com",
  }), (error) => error.status === 403 && error.safeCode === "CREDIT_ACCOUNT_RESTRICTED");
  assert.equal(sessions, 0);
});

function responseStub() {
  return {
    code: null, body: null,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
    end() { return this; },
  };
}
function requestStub(signature = "sig-valid") {
  return { method: "POST", headers: { "stripe-signature": signature }, async *[Symbol.asyncIterator]() { yield Buffer.from("signed-payload"); } };
}

function topupWebhookHarness({ salesFlag = "false", duplicate = false, signatureValid = true, eventOverride = null, sessionOverrides = {}, paymentIntentOverrides = {} } = {}) {
  const event = eventOverride || {
    id: "evt_topup_1", type: "checkout.session.completed", livemode: false,
    data: { object: { id: "cs_topup_1", mode: "payment", metadata: { premivateCheckoutType: "credit_topup" } } },
  };
  const session = {
    id: "cs_topup_1", mode: "payment", status: "complete", payment_status: "paid",
    currency: "chf", amount_total: 690, livemode: false, customer: "cus_1",
    payment_intent: "pi_topup_1",
    metadata: { premivateCheckoutType: "credit_topup", clerkUserId: "user_pro", creditPackage: "credits_25", credits: "25" },
    ...sessionOverrides,
  };
  const paymentIntent = {
    id: "pi_topup_1", status: "succeeded", amount: 690, amount_received: 690,
    currency: "chf", livemode: false, customer: "cus_1",
    metadata: { ...session.metadata },
    ...paymentIntentOverrides,
  };
  const state = { grants: [], signatureChecks: 0, activations: [] };
  const stripe = {
    webhooks: { constructEvent(_body, sig, secret) { state.signatureChecks++; if (!signatureValid || sig !== "sig-valid" || secret !== "whsec_offline") throw new Error("bad signature"); return event; } },
    checkout: { sessions: { async retrieve(id) { assert.equal(id, session.id); return session; } } },
    paymentIntents: { async retrieve(id) { assert.equal(id, paymentIntent.id); return paymentIntent; } },
    invoices: { retrieve: async () => { throw new Error("unused"); } },
    subscriptions: { retrieve: async () => { throw new Error("unused"); } },
  };
  class StripeMock { constructor() { return stripe; } }
  const api = loadModule("pages/api/stripe-webhook.js", {
    Stripe: StripeMock,
    activatePlan: async (...args) => { state.activations.push(args); },
    supabase: {},
    grantPaidPeriod: async () => ({ status: "granted_initial" }),
    grantPurchasedCredits: async (_db, input) => { state.grants.push(input); return { status: duplicate && state.grants.length > 1 ? "duplicate" : "granted" }; },
    processPaidCreditTopup: async (input) => {
      const mod = loadModule("lib/credit-topup.js", { grantPurchasedCredits: async (_db, x) => { state.grants.push(x); return { status: duplicate && state.grants.length > 1 ? "duplicate" : "granted" }; } });
      return mod.processPaidCreditTopup({ ...input, grant: async (_db, x) => { state.grants.push(x); return { status: duplicate && state.grants.length > 1 ? "duplicate" : "granted" }; } });
    },
    process: { env: { STRIPE_SECRET_KEY: "sk_test_offline", STRIPE_WEBHOOK_SECRET: "whsec_offline", PREMIVATE_TOPUP_SALES_ENABLED: salesFlag, VERCEL_ENV: "preview" } },
    Buffer,
  });
  return { handler: api.handler, state };
}

test("TEST A: signed paid top-up is granted once even after sales flag is off", async () => {
  const harness = topupWebhookHarness({ salesFlag: "false", duplicate: true });
  for (let i = 0; i < 2; i++) {
    const response = responseStub();
    await harness.handler(requestStub(), response);
    assert.equal(response.code, 200);
    assert.equal(response.body.topupGrantStatus, i === 0 ? "granted" : "duplicate");
  }
  assert.equal(harness.state.signatureChecks, 2);
  assert.equal(harness.state.grants.length, 2);
  assert.equal(harness.state.grants[0].paymentIntentId, "pi_topup_1");
  assert.equal(harness.state.grants[1].paymentIntentId, "pi_topup_1");
});

test("invalid Stripe signature cannot grant top-up credits", async () => {
  const harness = topupWebhookHarness({ signatureValid: false });
  const response = responseStub();
  await harness.handler(requestStub(), response);
  assert.equal(response.code, 400);
  assert.equal(harness.state.grants.length, 0);
});

test("unpaid or amount-mismatched sessions never grant top-up credits", async () => {
  for (const sessionOverrides of [
    { payment_status: "unpaid" },
    { amount_total: 1290 },
  ]) {
    const harness = topupWebhookHarness({ sessionOverrides });
    const response = responseStub();
    await harness.handler(requestStub(), response);
    assert.equal(response.code, 500);
    assert.equal(harness.state.grants.length, 0);
  }
});
