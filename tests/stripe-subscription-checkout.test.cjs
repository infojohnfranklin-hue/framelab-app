const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "../lib/stripe-subscription.js");
function loadMarketDataModule() {
  let source = fs.readFileSync(path.join(__dirname, "../lib/stripe-market-data.js"), "utf8")
    .replace(/^export\s+/gm, "");
  return vm.runInNewContext(
    `${source}\n({ CHECKOUT_MARKET_DATA_PARAMETERS, getCheckoutMarketData });`,
    {},
    { timeout: 1000 },
  );
}
const marketDataModule = loadMarketDataModule();
const CHECKOUT_MARKET_DATA_PARAMETERS = marketDataModule.CHECKOUT_MARKET_DATA_PARAMETERS;

function load(sourceOverrides = {}) {
  let source = fs.readFileSync(sourcePath, "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace(/^export\s+/gm, "");
  return vm.runInNewContext(`${source}\n({ createProSubscriptionCheckout, isBlockingSubscriptionStatus });`, {
    randomUUID: () => "claim-test-1",
    URL,
    CHECKOUT_MARKET_DATA_PARAMETERS,
    isPremivateOwner: (id) => id === "owner-id",
    stripeSecretMatchesEnvironment: (env) => env.STRIPE_SECRET_KEY === "sk_test_unit" && env.VERCEL_ENV === "preview",
    ...sourceOverrides,
  }, { timeout: 1000 });
}

function setup({ subscriptions = [], sessions = [], rpcData = { status: "claimed" }, customer = null } = {}) {
  const calls = { stripeSessions: [], rpc: [], customers: [], saveCustomer: [] };
  const stripe = {
    customers: {
      async retrieve(id) { return { id, deleted: false }; },
      async create(data, options) { calls.customers.push({ data, options }); return { id: "cus_test_1" }; },
    },
    subscriptions: { async list(input) { calls.subscriptionQuery = input; return { data: subscriptions, has_more: false }; } },
    checkout: { sessions: {
      async list(input) { calls.openSessionQuery = input; return { data: sessions, has_more: false }; },
      async create(params, options) { calls.stripeSessions.push({ params, options }); return { id: "cs_test_1", url: "https://checkout.stripe.test/cs_test_1", expires_at: 1_900_000_000 }; },
    } },
  };
  const supabase = { async rpc(name, args) { calls.rpc.push({ name, args }); return { data: rpcData, error: null }; } };
  const api = load();
  return { api, calls, stripe, supabase, customer };
}

const base = {
  env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" },
  userId: "user_test_pro", getCustomerId: async () => null,
  createCustomer: async () => ({ id: "cus_test_1" }),
  saveCustomerId: async (...args) => { saved.push(args); },
  baseUrl: "https://premivate-preview.example",
};
let saved;

test("Stripe-safe buyer values map to the existing canonical categories", () => {
  const marketData = marketDataModule.getCheckoutMarketData({
    customer_details: { address: { country: "nz" }, tax_ids: [] },
    custom_fields: [{ key: "buyertype", dropdown: { value: "businessregistered" } }],
  });
  assert.deepEqual({ ...marketData }, {
    buyerType: "business_registered",
    billingCountry: "NZ",
    taxIdProvided: false,
  });
  assert.equal(marketDataModule.getCheckoutMarketData({
    customer_details: { address: { country: "NZ" } },
    custom_fields: [{ key: "buyertype", dropdown: { value: "business_registered" } }],
  }), null);
});

test("subscription checkout uses the fixed CHF 24 monthly offer and guarded claim", async () => {
  const h = setup(); saved = [];
  const result = await h.api.createProSubscriptionCheckout({
    ...base,
    stripe: h.stripe,
    supabase: h.supabase,
    saveCustomerId: async (...args) => saved.push(args),
  });
  assert.equal(result.url, "https://checkout.stripe.test/cs_test_1");
  const created = h.calls.stripeSessions[0];
  assert.equal(created.params.mode, "subscription");
  assert.equal(created.params.line_items[0].price_data.currency, "chf");
  assert.equal(created.params.line_items[0].price_data.unit_amount, 2400);
  assert.equal(created.params.line_items[0].price_data.recurring.interval, "month");
  assert.equal(created.params.line_items[0].price_data.recurring.interval_count, 1);
  assert.equal(created.params.client_reference_id, "user_test_pro");
  assert.equal(created.params.metadata.premivateCheckoutClaim, "claim-test-1");
  assert.deepEqual(
    Array.from(created.params.custom_fields[0].dropdown.options, (option) => option.value),
    ["consumer", "businessregistered", "businessunregistered", "businessunknown"],
  );
  assert.equal(created.options.idempotencyKey, "premivate-pro-checkout-claim-test-1");
  assert.deepEqual(h.calls.rpc.map((item) => item.name), [
    "premivate_subscription_checkout_claim", "premivate_subscription_checkout_attach_session",
  ]);
});

test("active, past_due, unpaid, incomplete or trialing subscription blocks another checkout", async () => {
  for (const status of ["active", "past_due", "unpaid", "incomplete", "trialing", "paused"]) {
    const h = setup({ subscriptions: [{ id: "sub_existing", status }] });
    await assert.rejects(h.api.createProSubscriptionCheckout({ ...base, stripe: h.stripe, supabase: h.supabase,
      saveCustomerId: async () => {} }), (error) => error.status === 409 && error.safeCode === "SUBSCRIPTION_ALREADY_EXISTS");
    assert.equal(h.calls.stripeSessions.length, 0);
    assert.deepEqual(h.calls.rpc.map((item) => item.name), [
      "premivate_subscription_checkout_claim",
      "premivate_subscription_checkout_release",
    ]);
  }
});

test("open subscription checkout and incomplete Stripe listings fail closed", async () => {
  const open = setup({ sessions: [{ mode: "subscription", metadata: { clerkUserId: "user_test_pro" } }] });
  await assert.rejects(open.api.createProSubscriptionCheckout({ ...base, stripe: open.stripe, supabase: open.supabase,
    saveCustomerId: async () => {} }), (error) => error.safeCode === "SUBSCRIPTION_CHECKOUT_ALREADY_OPEN");
  const incompleteApi = load();
  const stripe = { ...open.stripe, subscriptions: { list: async () => ({ data: [], has_more: true }) } };
  await assert.rejects(incompleteApi.createProSubscriptionCheckout({ ...base, stripe, supabase: open.supabase,
    saveCustomerId: async () => {} }), (error) => error.safeCode === "SUBSCRIPTION_LOOKUP_INCOMPLETE");
});

test("Owner does not create a paid subscription; Stripe mode mismatch blocks checkout", async () => {
  const h = setup();
  await assert.rejects(h.api.createProSubscriptionCheckout({ ...base, userId: "owner-id", stripe: h.stripe, supabase: h.supabase,
    saveCustomerId: async () => {} }), (error) => error.safeCode === "OWNER_DOES_NOT_NEED_SUBSCRIPTION");
  await assert.rejects(h.api.createProSubscriptionCheckout({ ...base, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_live_wrong" }, stripe: h.stripe, supabase: h.supabase,
    saveCustomerId: async () => {} }), (error) => error.safeCode === "STRIPE_MODE_MISMATCH");
  assert.equal(h.calls.stripeSessions.length, 0);
});

test("failed checkout creation releases only the unbound claim", async () => {
  const h = setup();
  h.stripe.checkout.sessions.create = async () => { throw new Error("stripe unavailable"); };
  await assert.rejects(h.api.createProSubscriptionCheckout({ ...base, stripe: h.stripe, supabase: h.supabase,
    saveCustomerId: async () => {} }));
  assert.deepEqual(h.calls.rpc.map((item) => item.name), [
    "premivate_subscription_checkout_claim", "premivate_subscription_checkout_release",
  ]);
});
