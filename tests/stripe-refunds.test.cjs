const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const file = path.join(__dirname, "../lib/stripe-refunds.js");
const packages = Object.freeze({
  credits_25: Object.freeze({ credits: 25, amount: 690 }),
  credits_50: Object.freeze({ credits: 50, amount: 1290 }),
});
function load() {
  const source = fs.readFileSync(file, "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace(/^export\s+/gm, "");
  return vm.runInNewContext(`${source}\n({ processStripeChargeRefund });`, {
    CREDIT_TOPUP_PACKAGES: packages,
    stripeEventMatchesEnvironment: (event, env) => typeof event?.livemode === "boolean" &&
      event.livemode === (env.VERCEL_ENV === "production") &&
      (env.VERCEL_ENV === "production" ? env.STRIPE_SECRET_KEY?.startsWith("sk_live_") : env.STRIPE_SECRET_KEY?.startsWith("sk_test_")),
  }, { timeout: 1000 }).processStripeChargeRefund;
}
function objects({ partial = false, consumed = 0, paymentIntent = true } = {}) {
  const pi = { id: "pi_topup", status: "succeeded", amount: 690, amount_received: 690,
    currency: "chf", livemode: false, customer: "cus_test",
    metadata: { premivateCheckoutType: "credit_topup", clerkUserId: "user_test_pro", creditPackage: "credits_25", credits: "25" } };
  const charge = { id: "ch_test", object: "charge", paid: true, livemode: false,
    amount: 690, amount_refunded: partial ? 100 : 690, refunded: !partial,
    currency: "chf", customer: "cus_test", invoice: null, payment_intent: paymentIntent ? "pi_topup" : null };
  const calls = { refund: [], review: [], reads: [] };
  const stripe = {
    charges: { async retrieve(id) { calls.reads.push(["charge", id]); return charge; } },
    paymentIntents: { async retrieve(id) { calls.reads.push(["pi", id]); return pi; } },
    invoices: { async retrieve() { throw new Error("not used"); } },
    subscriptions: { async retrieve() { throw new Error("not used"); } },
  };
  const supabase = { async rpc(name, args) {
    if (name === "premivate_credit_refund_source") {
      calls.refund.push(args);
      return { data: { status: consumed ? "refunded_with_consumed" : "refunded", revokedCredits: 25 - consumed, consumedCredits: consumed }, error: null };
    }
    if (name === "premivate_credit_record_refund_review") {
      calls.review.push(args); return { data: { status: "recorded" }, error: null };
    }
    throw new Error("unexpected RPC");
  } };
  const event = { id: "evt_refund_1", type: "charge.refunded", livemode: false, data: { object: { object: "charge", id: "ch_test" } } };
  return { stripe, supabase, event, calls, pi, charge };
}

test("full top-up refund revokes only its PaymentIntent source; consumed portion remains documented", async () => {
  const fn = load();
  const h = objects({ consumed: 4 });
  const result = await fn({ ...h, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" } });
  assert.equal(result.status, "refunded_with_consumed");
  assert.equal(result.revokedCredits, 21);
  assert.equal(result.consumedCredits, 4);
  assert.equal(h.calls.refund.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls.refund[0])), {
    p_clerk_user_id: "user_test_pro", p_source_type: "topup",
    p_source_reference_id: "pi_topup", p_stripe_event_id: "evt_refund_1",
  });
  assert.equal(h.calls.review.length, 0);
});

test("partial refund is logged for manual review and never automatically removes credits", async () => {
  const fn = load();
  const h = objects({ partial: true });
  const result = await fn({ ...h, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" } });
  assert.equal(result.status, "manual_review_partial");
  assert.equal(h.calls.review[0].p_reason, "PARTIAL_REFUND_REQUIRES_MANUAL_REVIEW");
  assert.equal(h.calls.refund.length, 0);
});

test("missing PaymentIntent is recorded instead of silently ignored", async () => {
  const fn = load();
  const h = objects({ paymentIntent: false });
  const result = await fn({ ...h, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" } });
  assert.equal(result.status, "manual_review");
  assert.equal(h.calls.review[0].p_reason, "PAYMENT_INTENT_MISSING");
  assert.equal(h.calls.refund.length, 0);
});

test("unresolved refund source is recorded without a guessed user mapping", async () => {
  const fn = load();
  const h = objects({});
  h.pi.metadata = { unrelated: "charge" };
  const result = await fn({ ...h, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" } });
  assert.equal(result.status, "manual_review_unresolved");
  assert.equal(h.calls.review[0].p_reason, "REFUND_SOURCE_UNRESOLVED");
  assert.equal(h.calls.review[0].p_clerk_user_id, null);
});

test("Stripe mode mismatch and package amount mismatch fail before refund RPC", async () => {
  const fn = load();
  const h = objects();
  await assert.rejects(fn({ ...h, event: { ...h.event, livemode: true }, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" } }), /STRIPE_MODE_MISMATCH/);
  h.pi.amount = 1290;
  await assert.rejects(fn({ ...h, env: { VERCEL_ENV: "preview", STRIPE_SECRET_KEY: "sk_test_unit" } }), /TOPUP_REFUND_PAYMENT_VALIDATION_FAILED/);
  assert.equal(h.calls.refund.length, 0);
});
