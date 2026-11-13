const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
function load(file, bindings, exports) {
  let source = fs.readFileSync(path.join(root, file), "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace(/^export default async function handler/m, "async function handler")
    .replace(/^export\s+/gm, "");
  return vm.runInNewContext(`${source}\n({ ${exports.join(", ")} });`, bindings, { timeout: 1000 });
}

function responseStub() {
  return {
    code: null,
    body: null,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("only Preview/local test keys and Production live keys match", () => {
  const api = load("lib/stripe-mode.js", {}, ["expectedStripeLivemode", "stripeSecretMatchesEnvironment", "stripeEventMatchesEnvironment", "getStripeBaseUrl"]);
  assert.equal(api.stripeSecretMatchesEnvironment({ VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_preview" }), true);
  assert.equal(api.stripeSecretMatchesEnvironment({ VERCEL_ENV: "production", STRIPE_SECRET_KEY: "sk_live_prod" }), true);
  assert.equal(api.stripeSecretMatchesEnvironment({ VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_live_wrong" }), false);
  assert.equal(api.stripeSecretMatchesEnvironment({ VERCEL_ENV: "production", STRIPE_SECRET_KEY: "sk_test_wrong" }), false);
  assert.equal(api.expectedStripeLivemode({ VERCEL_ENV: "development" }), false);
  assert.equal(api.expectedStripeLivemode({}), null);
  assert.equal(api.expectedStripeLivemode({ VERCEL_ENV: "staging" }), null);
  assert.equal(api.stripeSecretMatchesEnvironment({ STRIPE_SECRET_KEY: "sk_test_missing_env" }), false);
  assert.equal(api.stripeSecretMatchesEnvironment({ VERCEL_ENV: "staging", STRIPE_SECRET_KEY: "sk_test_unknown_env" }), false);
  assert.equal(api.stripeEventMatchesEnvironment({ livemode: true }, { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_preview" }), false);

  const topup = load("lib/credit-topup.js", {
    stripeSecretMatchesEnvironment: api.stripeSecretMatchesEnvironment,
  }, ["isTopupSalesEnabled"]);
  const enabledTopupConfig = {
    NODE_ENV: "production",
    PREMIVATE_TOPUP_SALES_ENABLED: "true",
    PREMIVATE_CREDIT_LEDGER_BALANCE_ENABLED: "true",
    PREMIVATE_PRO_CREDIT_LEDGER_ENABLED: "true",
    PREMIVATE_PRO_TEXT_BLUEPRINT_CREDIT_LEDGER_ENABLED: "true",
    STRIPE_WEBHOOK_SECRET: "whsec_offline",
  };
  assert.equal(topup.isTopupSalesEnabled({
    ...enabledTopupConfig,
    VERCEL_ENV: "preview",
    STRIPE_SECRET_KEY: "sk_test_preview",
  }), true);
  assert.equal(topup.isTopupSalesEnabled({
    ...enabledTopupConfig,
    VERCEL_ENV: "preview",
    STRIPE_SECRET_KEY: "sk_live_preview_wrong",
  }), false);
  assert.equal(topup.isTopupSalesEnabled({
    ...enabledTopupConfig,
    VERCEL_ENV: "production",
    STRIPE_SECRET_KEY: "sk_test_production_wrong",
  }), false);
  assert.equal(topup.isTopupSalesEnabled({
    ...enabledTopupConfig,
    VERCEL_ENV: "production",
    STRIPE_SECRET_KEY: "sk_live_production",
  }), true);
  assert.equal(topup.isTopupSalesEnabled({
    ...enabledTopupConfig,
    STRIPE_SECRET_KEY: "sk_test_missing_vercel_env",
  }), false);

  assert.equal(api.getStripeBaseUrl({
    VERCEL_ENV: "preview",
    VERCEL_URL: "framelab-preview-abc.vercel.app",
    NEXT_PUBLIC_BASE_URL: "https://premivate.com",
  }), "https://framelab-preview-abc.vercel.app");
  assert.equal(api.getStripeBaseUrl({
    VERCEL_ENV: "preview",
    VERCEL_URL: "attacker.example",
    NEXT_PUBLIC_BASE_URL: "https://premivate.com",
  }), null);
  assert.equal(api.getStripeBaseUrl({
    VERCEL_ENV: "production",
    VERCEL_URL: "framelab-preview-abc.vercel.app",
    NEXT_PUBLIC_BASE_URL: "https://premivate.com",
  }), "https://premivate.com");
});

test("billing portal fails closed before Stripe access when the Preview return host is invalid", async () => {
  const stripeMode = load("lib/stripe-mode.js", {}, ["stripeSecretMatchesEnvironment", "getStripeBaseUrl"]);
  let stripeInstances = 0;
  let customerLookups = 0;
  const api = load("pages/api/create-portal-session.js", {
    Stripe: class { constructor() { stripeInstances++; } },
    getAuth: () => ({ userId: "user_preview" }),
    assertAccountNotDeleting: async () => true,
    supabase: {},
    getStripeCustomerId: async () => { customerLookups++; return "cus_preview"; },
    getStripeBaseUrl: stripeMode.getStripeBaseUrl,
    stripeSecretMatchesEnvironment: stripeMode.stripeSecretMatchesEnvironment,
    process: { env: { VERCEL_ENV: "preview", VERCEL_URL: "untrusted.example", STRIPE_SECRET_KEY: "sk_test_offline" } },
    console: { error() {} },
  }, ["handler"]);
  const response = responseStub();
  await api.handler({ method: "POST" }, response);
  assert.equal(response.code, 503);
  assert.equal(response.body.error, "STRIPE_BASE_URL_UNAVAILABLE");
  assert.equal(stripeInstances, 0);
  assert.equal(customerLookups, 0);
});

function profileClient({ row, readError = null } = {}) {
  const writes = [];
  const client = {
    from() {
      const query = {
        select() { return query; },
        eq() { return query; },
        maybeSingle: async () => ({ data: row, error: readError }),
        upsert: async (value) => { writes.push(value); return { error: null }; },
      };
      return query;
    },
  };
  return { client, writes };
}

function proModule(db) {
  return load("lib/pro.js", {
    createClient: () => db.client,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test", SUPABASE_SERVICE_ROLE_KEY: "redacted-test" } },
  }, ["getEffectiveUserPlan", "updateStripeSubscription", "isPremivateOwner"]);
}

test("effective plan retains legacy Pro but lifecycle-managed access follows paid-through", async () => {
  const legacy = proModule(profileClient({ row: { plan: "pro", stripe_subscription_id: null, stripe_subscription_status: null } }));
  assert.equal(await legacy.getEffectiveUserPlan("user_legacy"), "pro");
  const future = proModule(profileClient({ row: { plan: "free", stripe_subscription_id: "sub_1", stripe_subscription_status: "canceled", stripe_paid_through: new Date(Date.now() + 60_000).toISOString() } }));
  assert.equal(await future.getEffectiveUserPlan("user_paid_through"), "pro");
  const expired = proModule(profileClient({ row: { plan: "pro", stripe_subscription_id: "sub_1", stripe_subscription_status: "canceled", stripe_paid_through: new Date(Date.now() - 60_000).toISOString() } }));
  assert.equal(await expired.getEffectiveUserPlan("user_expired"), "free");
});

test("scheduled cancellation preserves paid-through while immediate cancellation ends access", async () => {
  const current = { stripe_subscription_id: "sub_1", stripe_paid_through: new Date(Date.now() + 86_400_000).toISOString() };
  const scheduledDb = profileClient({ row: current });
  const scheduled = proModule(scheduledDb);
  const scheduledResult = await scheduled.updateStripeSubscription("user_test", {
    subscriptionId: "sub_1", status: "active", cancelAtPeriodEnd: true, livemode: false,
  });
  assert.equal(scheduledResult.plan, "pro");
  assert.equal(scheduledDb.writes[0].stripe_cancel_at_period_end, true);

  const endedDb = profileClient({ row: current });
  const ended = proModule(endedDb);
  const endedResult = await ended.updateStripeSubscription("user_test", {
    subscriptionId: "sub_1", status: "canceled", cancelAtPeriodEnd: false, immediateEnd: true, livemode: false,
  });
  assert.equal(endedResult.plan, "free");
  assert.ok(Date.parse(endedDb.writes[0].stripe_paid_through) <= Date.now());
});
