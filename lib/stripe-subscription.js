import { randomUUID } from "node:crypto";
import { isPremivateOwner } from "./pro";
import { stripeSecretMatchesEnvironment } from "./stripe-mode";

const BLOCKING_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

function fail(status, code) {
  const error = new Error(code);
  error.status = status;
  error.safeCode = code;
  return error;
}

function stripeId(value) {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : null;
}

async function claimCheckout(supabase, userId, claimToken) {
  const { data, error } = await supabase.rpc("premivate_subscription_checkout_claim", {
    p_clerk_user_id: userId,
    p_claim_token: claimToken,
  });
  if (error) throw fail(503, "SUBSCRIPTION_CHECKOUT_LOCK_UNAVAILABLE");
  if (data?.status !== "claimed") throw fail(409, "SUBSCRIPTION_CHECKOUT_ALREADY_OPEN");
}

async function releaseCheckout(supabase, userId, claimToken) {
  const { error } = await supabase.rpc("premivate_subscription_checkout_release", {
    p_clerk_user_id: userId,
    p_claim_token: claimToken,
  });
  if (error) throw error;
}

export async function createProSubscriptionCheckout({
  env = process.env,
  userId,
  stripe,
  supabase,
  getCustomerId,
  createCustomer,
  saveCustomerId,
  baseUrl,
}) {
  if (!stripeSecretMatchesEnvironment(env)) throw fail(503, "STRIPE_MODE_MISMATCH");
  if (typeof userId !== "string" || !userId.trim()) throw fail(401, "AUTH_REQUIRED");
  if (isPremivateOwner(userId)) throw fail(409, "OWNER_DOES_NOT_NEED_SUBSCRIPTION");
  if (!stripe || !supabase) throw fail(503, "BILLING_UNAVAILABLE");

  let base;
  try { base = new URL(baseUrl); } catch { throw fail(503, "CHECKOUT_BASE_URL_INVALID"); }
  if (!(["http:", "https:"].includes(base.protocol))) {
    throw fail(503, "CHECKOUT_BASE_URL_INVALID");
  }

  const claimToken = randomUUID();
  await claimCheckout(supabase, userId, claimToken);
  let sessionCreated = false;
  try {
    let customerId = await getCustomerId(userId);
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.id !== customerId || customer.deleted === true) {
        customerId = null;
      }
    }
    if (!customerId) {
      const customer = await createCustomer(userId);
      customerId = stripeId(customer);
      if (!customerId) throw fail(502, "STRIPE_CUSTOMER_INVALID");
      await saveCustomerId(userId, customerId);
    }

    const [subscriptions, openSessions] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 }),
      stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 }),
    ]);
    if (subscriptions?.has_more === true || openSessions?.has_more === true) {
      throw fail(503, "SUBSCRIPTION_LOOKUP_INCOMPLETE");
    }
    if ((subscriptions?.data || []).some((item) => BLOCKING_SUBSCRIPTION_STATUSES.has(item.status))) {
      throw fail(409, "SUBSCRIPTION_ALREADY_EXISTS");
    }
    if ((openSessions?.data || []).some((item) =>
      item.mode === "subscription" && item.metadata?.clerkUserId === userId
    )) {
      throw fail(409, "SUBSCRIPTION_CHECKOUT_ALREADY_OPEN");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      branding_settings: { display_name: "PREMIVATE" },
      payment_method_types: ["card"],
      client_reference_id: userId,
      metadata: { clerkUserId: userId, premivateCheckoutClaim: claimToken },
      subscription_data: {
        metadata: { clerkUserId: userId, premivateCheckoutClaim: claimToken },
      },
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: { name: "Premivate Pro" },
          unit_amount: 2400,
          recurring: { interval: "month", interval_count: 1 },
        },
        quantity: 1,
      }],
      success_url: new URL("/success", base).toString(),
      cancel_url: new URL("/pricing", base).toString(),
    }, { idempotencyKey: `premivate-pro-checkout-${claimToken}` });

    if (!session || typeof session.url !== "string" || !session.url.startsWith("https://") ||
        typeof session.id !== "string" || !Number.isSafeInteger(session.expires_at)) {
      throw fail(502, "CHECKOUT_SESSION_INVALID");
    }
    sessionCreated = true;
    const { error } = await supabase.rpc("premivate_subscription_checkout_attach_session", {
      p_clerk_user_id: userId,
      p_claim_token: claimToken,
      p_stripe_session_id: session.id,
      p_expires_at: new Date(session.expires_at * 1000).toISOString(),
    });
    if (error) throw fail(503, "SUBSCRIPTION_CHECKOUT_LOCK_UNAVAILABLE");
    return { url: session.url };
  } catch (error) {
    // If Stripe has returned a session, keep the claim until its signed
    // checkout.session.expired/completed event resolves it.
    if (!sessionCreated) await releaseCheckout(supabase, userId, claimToken).catch(() => {});
    throw error;
  }
}

export function isBlockingSubscriptionStatus(status) {
  return BLOCKING_SUBSCRIPTION_STATUSES.has(status);
}
