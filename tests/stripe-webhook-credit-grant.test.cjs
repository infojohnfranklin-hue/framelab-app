const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const endpointPath = path.join(__dirname, "../pages/api/stripe-webhook.js");
const PERIOD_START = 1_800_000_000;
const PERIOD_END = 1_802_592_000;

function makeInvoice(overrides = {}) {
  return {
    id: "in_premivate_1", object: "invoice", billing_reason: "subscription_create",
    status: "paid", amount_paid: 2400, amount_remaining: 0, currency: "chf",
    customer: "cus_premivate_1", livemode: false,
    parent: { type: "subscription_details", subscription_details: { subscription: "sub_premivate_1" } },
    lines: { has_more: false, data: [{
      currency: "chf", quantity: 1, period: { start: PERIOD_START, end: PERIOD_END },
      pricing: { type: "price_details", price_details: { price: "price_premivate_24" } },
      parent: { type: "subscription_item_details", subscription_item_details: {
        subscription: "sub_premivate_1", subscription_item: "si_premivate_1", proration: false,
      } },
    }] },
    ...overrides,
  };
}

function makeSubscription(overrides = {}) {
  return {
    id: "sub_premivate_1", customer: "cus_premivate_1", livemode: false,
    status: "active", cancel_at_period_end: false,
    metadata: { clerkUserId: "user_test_pro" },
    items: { has_more: false, data: [{
      id: "si_premivate_1",
      price: { id: "price_premivate_24", type: "recurring", currency: "chf", unit_amount: 2400,
        recurring: { interval: "month", interval_count: 1 },
        product: { id: "prod_premivate", name: "Premivate Pro" } },
    }] },
    ...overrides,
  };
}

function makeEvent(type = "invoice.payment_succeeded", id = "evt_invoice_1", object = { id: "in_premivate_1", object: "invoice" }, overrides = {}) {
  return { id, type, livemode: false, data: { object }, ...overrides };
}

function matchesStripeMode(event, env) {
  const expectedLive = env.VERCEL_ENV === "production";
  return typeof event?.livemode === "boolean" && event.livemode === expectedLive &&
    (expectedLive ? env.STRIPE_SECRET_KEY?.startsWith("sk_live_") : env.STRIPE_SECRET_KEY?.startsWith("sk_test_"));
}

function createHarness({
  event = makeEvent(), invoice = makeInvoice(), subscription = makeSubscription(),
  grantResults = [{ status: "granted_initial" }], grantError = null,
  session = null, env = {}, rpcError = null,
} = {}) {
  const state = { invoiceReads: [], subscriptionReads: [], grants: [], activations: [],
    lifecycleUpdates: [], savedCustomers: [], rpcCalls: [], logs: [] };
  const stripe = {
    webhooks: { constructEvent: () => event },
    invoices: { async retrieve(id) { state.invoiceReads.push(id); return invoice; } },
    subscriptions: { async retrieve(id, options) { state.subscriptionReads.push({ id, options }); return subscription; } },
    checkout: { sessions: { async retrieve(id) { state.sessionReads = (state.sessionReads || []).concat(id); return session; } } },
  };
  class StripeMock { constructor() { return stripe; } }
  const source = fs.readFileSync(endpointPath, "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace("export default async function handler", "async function handler")
    .replace(/^export\s+/gm, "");
  const { handler } = vm.runInNewContext(`${source}\n({ handler });`, {
    Stripe: StripeMock,
    activatePlan: async (...args) => state.activations.push(args),
    supabase: { async rpc(name, args) { state.rpcCalls.push({ name, args }); return { data: { status: "completed" }, error: rpcError }; } },
    grantPaidPeriod: async (_supabase, input) => {
      state.grants.push(JSON.parse(JSON.stringify(input)));
      if (grantError) throw grantError;
      return grantResults.shift() || { status: "granted_initial" };
    },
    saveStripeCustomerId: async (...args) => state.savedCustomers.push(args),
    persistCheckoutMarketData: async () => ({ status: "not_collected" }),
    updateStripeSubscription: async (...args) => state.lifecycleUpdates.push(args),
    processPaidCreditTopup: async () => ({ status: "granted" }),
    processStripeChargeRefund: async () => ({ status: "refunded" }),
    isAccountDeletionMarked: async () => false,
    stripeEventMatchesEnvironment: matchesStripeMode,
    process: { env: { STRIPE_SECRET_KEY: "sk_test_offline", STRIPE_WEBHOOK_SECRET: "whsec_offline", VERCEL_ENV: "preview", ...env } },
    Buffer,
    console: { log: (...args) => state.logs.push(args), error: (...args) => state.logs.push(args) },
  }, { timeout: 1000 });
  return { handler, state };
}

function response() {
  return { statusCode: null, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; }, end() { return this; } };
}

async function invoke(handler, method = "POST") {
  const req = { method, headers: { "stripe-signature": "offline-signature" },
    async *[Symbol.asyncIterator]() { yield Buffer.from("offline-event-payload"); } };
  const res = response();
  await handler(req, res);
  return res;
}

function expectedGrant(eventId, periodKind) {
  return { userId: "user_test_pro", subscriptionId: "sub_premivate_1", invoiceId: "in_premivate_1",
    eventId, periodKind, periodStart: new Date(PERIOD_START * 1000).toISOString(),
    periodEnd: new Date(PERIOD_END * 1000).toISOString() };
}

test("paid first subscription invoice grants one initial period and records paid-through", async () => {
  const h = createHarness();
  const res = await invoke(h.handler);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.creditGrantStatus, "granted_initial");
  assert.deepEqual(h.state.grants, [expectedGrant("evt_invoice_1", "initial")]);
  assert.equal(h.state.lifecycleUpdates.length, 1);
  assert.equal(h.state.lifecycleUpdates[0][0], "user_test_pro");
  assert.equal(h.state.lifecycleUpdates[0][1].paidThrough, new Date(PERIOD_END * 1000).toISOString());
});

test("paid recurring invoice grants a cycle and duplicate delivery remains idempotent", async () => {
  const h = createHarness({ invoice: makeInvoice({ billing_reason: "subscription_cycle" }),
    grantResults: [{ status: "granted_cycle" }, { status: "duplicate" }] });
  const first = await invoke(h.handler);
  const replay = await invoke(h.handler);
  assert.equal(first.statusCode, 200);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.body.creditGrantStatus, "duplicate");
  assert.equal(h.state.grants.length, 2);
  assert.equal(h.state.grants[0].invoiceId, h.state.grants[1].invoiceId);
});

test("unsupported and unpaid invoices grant no credits", async () => {
  for (const invoice of [makeInvoice({ billing_reason: "subscription_update" }),
    makeInvoice({ status: "open", amount_remaining: 2400 })]) {
    const h = createHarness({ invoice });
    const res = await invoke(h.handler);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.creditGrantStatus, "ignored");
    assert.equal(h.state.grants.length, 0);
  }
});

test("wrong customer, price, or out-of-order ledger errors fail closed", async () => {
  const mismatch = createHarness({ subscription: makeSubscription({ customer: "cus_other" }) });
  assert.equal((await invoke(mismatch.handler)).statusCode, 500);
  assert.equal(mismatch.state.grants.length, 0);
  const badPrice = makeSubscription();
  badPrice.items.data[0].price.unit_amount = 1900;
  const wrongPrice = createHarness({ subscription: badPrice });
  assert.equal((await invoke(wrongPrice.handler)).statusCode, 500);
  const conflict = createHarness({ grantError: Object.assign(new Error("period conflict"), { code: "23514" }) });
  assert.equal((await invoke(conflict.handler)).statusCode, 500);
});

test("test/live mismatch is rejected before Stripe invoice or ledger access", async () => {
  const h = createHarness({ event: makeEvent("invoice.payment_succeeded", "evt_live", { id: "in_premivate_1", object: "invoice" }, { livemode: true }) });
  const res = await invoke(h.handler);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "STRIPE_MODE_MISMATCH");
  assert.equal(h.state.invoiceReads.length, 0);
  assert.equal(h.state.grants.length, 0);
});

test("normal cancellation retains paid-through access while immediate cancellation expires it", async () => {
  const now = createHarness({ event: makeEvent("customer.subscription.updated", "evt_cancel", { id: "sub_premivate_1" }),
    subscription: makeSubscription({ status: "active", cancel_at_period_end: true }) });
  assert.equal((await invoke(now.handler)).statusCode, 200);
  assert.equal(now.state.lifecycleUpdates[0][1].cancelAtPeriodEnd, true);
  assert.notEqual(now.state.lifecycleUpdates[0][1].immediateEnd, true);

  const ended = createHarness({ event: makeEvent("customer.subscription.deleted", "evt_deleted", { id: "sub_premivate_1" }),
    subscription: makeSubscription({ status: "canceled", cancel_at_period_end: false }) });
  assert.equal((await invoke(ended.handler)).statusCode, 200);
  assert.equal(ended.state.lifecycleUpdates[0][1].immediateEnd, true);
});

test("failed invoice grants nothing and synchronizes canonical past_due status", async () => {
  const h = createHarness({
    event: makeEvent("invoice.payment_failed", "evt_failed"),
    invoice: makeInvoice({ status: "open", amount_paid: 0, amount_remaining: 2400 }),
    subscription: makeSubscription({ status: "past_due" }),
  });
  const res = await invoke(h.handler);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.paymentStatus, "updated");
  assert.equal(h.state.grants.length, 0);
  assert.equal(h.state.lifecycleUpdates[0][1].status, "past_due");
  assert.equal(h.state.lifecycleUpdates[0][1].paidThrough, undefined);
});

test("late failed invoice after recovery does not overwrite paid access", async () => {
  const h = createHarness({ event: makeEvent("invoice.payment_failed", "evt_late_failed"),
    invoice: makeInvoice({ status: "paid", amount_remaining: 0 }) });
  const res = await invoke(h.handler);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.paymentStatus, "recovered");
  assert.equal(h.state.lifecycleUpdates.length, 0);
  assert.equal(h.state.grants.length, 0);
});

test("subscription Checkout completion records customer and claim but does not grant or activate by itself", async () => {
  const event = makeEvent("checkout.session.completed", "evt_checkout", { id: "cs_test_1", mode: "subscription" });
  const session = { id: "cs_test_1", mode: "subscription", status: "complete", payment_status: "paid",
    livemode: false, customer: "cus_premivate_1", subscription: "sub_premivate_1",
    metadata: { clerkUserId: "user_test_pro", premivateCheckoutClaim: "claim_1" } };
  const h = createHarness({ event, session });
  const res = await invoke(h.handler);
  assert.equal(res.statusCode, 200);
  assert.equal(h.state.activations.length, 0);
  assert.equal(h.state.grants.length, 0);
  assert.deepEqual(h.state.savedCustomers, [["user_test_pro", "cus_premivate_1"]]);
  assert.equal(h.state.rpcCalls[0].name, "premivate_subscription_checkout_complete");
});
