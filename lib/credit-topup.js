import { randomUUID } from "node:crypto";
import { grantPurchasedCredits } from "./credit-ledger";
import { isPremivateOwner } from "./pro";
import { stripeSecretMatchesEnvironment } from "./stripe-mode";
import { CHECKOUT_MARKET_DATA_PARAMETERS, persistCheckoutMarketData } from "./stripe-market-data";

export const CREDIT_TOPUP_PACKAGES = Object.freeze({
  credits_25: Object.freeze({ credits: 25, amount: 690, name: "Premivate 25 Credits" }),
  credits_50: Object.freeze({ credits: 50, amount: 1290, name: "Premivate 50 Credits" }),
});

function failure(status, code) {
  const error = new Error(code);
  error.status = status;
  error.safeCode = code;
  return error;
}

export function getCreditTopupPackage(packageId) {
  if (!Object.prototype.hasOwnProperty.call(CREDIT_TOPUP_PACKAGES, packageId)) return null;
  return CREDIT_TOPUP_PACKAGES[packageId];
}

export function isTopupSalesEnabled(env = process.env) {
  const ledgerReady = env.PREMIVATE_CREDIT_LEDGER_BALANCE_ENABLED === "true" &&
    env.PREMIVATE_PRO_CREDIT_LEDGER_ENABLED === "true" &&
    env.PREMIVATE_PRO_TEXT_BLUEPRINT_CREDIT_LEDGER_ENABLED === "true";
  const secretConfigured = typeof env.STRIPE_SECRET_KEY === "string" &&
    env.STRIPE_SECRET_KEY.length > 0 &&
    typeof env.STRIPE_WEBHOOK_SECRET === "string" &&
    env.STRIPE_WEBHOOK_SECRET.length > 0;
  return env.PREMIVATE_TOPUP_SALES_ENABLED === "true" &&
    ledgerReady && secretConfigured && stripeSecretMatchesEnvironment(env);
}

export function validateTopupBalance(balance) {
  if (!balance || typeof balance !== "object" || Array.isArray(balance)) {
    throw failure(503, "TOPUP_BALANCE_UNAVAILABLE");
  }
  for (const key of ["subscriptionAvailable", "subscriptionHeld", "purchasedAvailable", "purchasedHeld"]) {
    if (!Number.isSafeInteger(balance[key]) || balance[key] < 0) {
      throw failure(503, "TOPUP_BALANCE_UNAVAILABLE");
    }
  }
  if (balance.subscriptionAvailable + balance.subscriptionHeld > 200) {
    throw failure(503, "TOPUP_BALANCE_UNAVAILABLE");
  }
  if (!Number.isSafeInteger(balance.subscriptionAvailable + balance.purchasedAvailable) ||
      !Number.isSafeInteger(balance.purchasedAvailable + balance.purchasedHeld)) {
    throw failure(503, "TOPUP_BALANCE_UNAVAILABLE");
  }
  return true;
}

export async function createCreditTopupCheckout({
  env = process.env,
  userId,
  packageId,
  getPlan,
  isProPlan,
  getBalance,
  getCustomerId,
  supabase,
  createSession,
  baseUrl,
}) {
  if (!isTopupSalesEnabled(env)) throw failure(503, "TOPUP_SALES_DISABLED");
  if (typeof userId !== "string" || !userId.trim()) throw failure(401, "AUTH_REQUIRED");
  if (isPremivateOwner(userId)) throw failure(403, "OWNER_DOES_NOT_NEED_TOPUPS");
  const product = getCreditTopupPackage(packageId);
  if (!product) throw failure(400, "TOPUP_PACKAGE_INVALID");

  let plan;
  try { plan = await getPlan(userId); }
  catch { throw failure(503, "PLAN_UNAVAILABLE"); }
  const proPlanCheck = typeof isProPlan === "function"
    ? isProPlan
    : (value) => typeof value === "string" && value.toLowerCase().includes("pro");
  if (!proPlanCheck(plan)) throw failure(403, "PRO_REQUIRED");

  let balance;
  try { balance = await getBalance(userId); }
  catch { throw failure(503, "TOPUP_BALANCE_UNAVAILABLE"); }
  validateTopupBalance(balance);
  if (balance.creditAccessBlocked === true) throw failure(403, "CREDIT_ACCOUNT_RESTRICTED");

  let customerId;
  try { customerId = await getCustomerId?.(userId); }
  catch { throw failure(503, "STRIPE_CUSTOMER_UNAVAILABLE"); }
  if (typeof customerId !== "string" || !customerId.trim()) {
    throw failure(409, "STRIPE_CUSTOMER_REQUIRED");
  }

  let base;
  try { base = new URL(baseUrl); }
  catch { throw failure(503, "CHECKOUT_BASE_URL_INVALID"); }
  if (!["http:", "https:"].includes(base.protocol)) throw failure(503, "CHECKOUT_BASE_URL_INVALID");

  const deletionCheckoutGuard = env.PREMIVATE_SELF_SERVICE_ACCOUNT_DELETION_ENABLED === "true";
  const claimToken = deletionCheckoutGuard ? randomUUID() : null;
  if (deletionCheckoutGuard) {
    if (!supabase?.rpc) throw failure(503, "ACCOUNT_DELETION_CHECKOUT_GUARD_UNAVAILABLE");
    const { data, error } = await supabase.rpc("premivate_self_service_checkout_claim", {
      p_clerk_user_id: userId,
      p_claim_token: claimToken,
      p_operation: "credit_topup",
    });
    if (error) throw failure(503, "ACCOUNT_DELETION_CHECKOUT_GUARD_UNAVAILABLE");
    if (data?.status !== "claimed") throw failure(409, "ACCOUNT_DELETION_IN_PROGRESS_OR_CHECKOUT_BUSY");
  }

  const metadata = {
    premivateCheckoutType: "credit_topup",
    clerkUserId: userId,
    creditPackage: packageId,
    credits: String(product.credits),
    ...(claimToken ? { premivateDeletionClaimToken: claimToken } : {}),
  };
  let sessionCreated = false;
  try {
    const session = await createSession({
      mode: "payment",
      customer: customerId,
      ...CHECKOUT_MARKET_DATA_PARAMETERS,
      payment_method_types: ["card"],
      branding_settings: { display_name: "PREMIVATE" },
      metadata,
      payment_intent_data: { metadata },
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: { name: product.name },
          unit_amount: product.amount,
        },
        quantity: 1,
      }],
      success_url: new URL("/settings?topup=success", base).toString(),
      cancel_url: new URL("/settings?topup=cancel", base).toString(),
    });
    sessionCreated = typeof session?.id === "string" && Boolean(session.id);
    if (!session || typeof session.url !== "string" || !session.url.startsWith("https://")) {
      throw failure(502, "CHECKOUT_SESSION_INVALID");
    }
    if (deletionCheckoutGuard) {
      if (!sessionCreated || !Number.isSafeInteger(session.expires_at)) {
        throw failure(502, "CHECKOUT_SESSION_INVALID");
      }
      const { data, error } = await supabase.rpc("premivate_self_service_checkout_attach", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_stripe_session_id: session.id,
        p_expires_at: new Date(session.expires_at * 1000).toISOString(),
      });
      if (error || data?.status !== "attached") {
        throw failure(503, "ACCOUNT_DELETION_CHECKOUT_GUARD_UNAVAILABLE");
      }
    }
    return { url: session.url };
  } catch (error) {
    if (deletionCheckoutGuard && !sessionCreated) {
      await supabase.rpc("premivate_self_service_checkout_finish", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_stripe_session_id: null,
        p_status: "released",
      }).catch(() => {});
    }
    throw error;
  }
}

export async function processPaidCreditTopup({
  event,
  stripe,
  supabase,
  env = process.env,
  grant = grantPurchasedCredits,
  isDeletionInProgress = async () => false,
}) {
  if (event?.type !== "checkout.session.completed") return { status: "ignored" };
  const snapshot = event.data?.object;
  if (snapshot?.metadata?.premivateCheckoutType !== "credit_topup") return { status: "ignored" };
  if (typeof snapshot.id !== "string" || !snapshot.id) throw failure(400, "TOPUP_SESSION_INVALID");

  const session = await stripe.checkout.sessions.retrieve(snapshot.id, { expand: ["payment_intent"] });
  const metadata = session?.metadata;
  const product = getCreditTopupPackage(metadata?.creditPackage);
  if (!product || metadata?.premivateCheckoutType !== "credit_topup" ||
      typeof metadata.clerkUserId !== "string" || !metadata.clerkUserId.trim() ||
      metadata.credits !== String(product.credits) || session.id !== snapshot.id ||
      session.mode !== "payment" || session.status !== "complete" ||
      session.payment_status !== "paid" || session.currency !== "chf" ||
      session.amount_total !== product.amount || typeof session.livemode !== "boolean" ||
      event.livemode !== session.livemode ||
      session.livemode !== (env.VERCEL_ENV === "production") ||
      sessionCustomerId(session.customer) === null) {
    throw failure(400, "TOPUP_SESSION_VALIDATION_FAILED");
  }
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  if (typeof paymentIntentId !== "string" || !paymentIntentId) throw failure(400, "TOPUP_PAYMENT_INTENT_INVALID");

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const piMetadata = paymentIntent?.metadata;
  const expectedLive = env.VERCEL_ENV === "production";
  if (paymentIntent?.id !== paymentIntentId || paymentIntent.status !== "succeeded" ||
      paymentIntent.amount !== product.amount || paymentIntent.amount_received !== product.amount ||
      paymentIntent.currency !== "chf" || paymentIntent.livemode !== session.livemode ||
      session.livemode !== expectedLive ||
      piMetadata?.premivateCheckoutType !== "credit_topup" ||
      piMetadata?.clerkUserId !== metadata.clerkUserId ||
      piMetadata?.creditPackage !== metadata.creditPackage ||
      piMetadata?.credits !== metadata.credits) {
    throw failure(400, "TOPUP_PAYMENT_VALIDATION_FAILED");
  }
  const sessionCustomer = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const paymentCustomer = typeof paymentIntent.customer === "string" ? paymentIntent.customer : paymentIntent.customer?.id;
  if (!sessionCustomer || !paymentCustomer || sessionCustomer !== paymentCustomer) {
    throw failure(400, "TOPUP_CUSTOMER_MISMATCH");
  }

  if (await isDeletionInProgress(metadata.clerkUserId)) {
    return { status: "suppressed_account_deletion" };
  }

  await persistCheckoutMarketData({ session, stripe, paymentIntentId });

  const result = await grant(supabase, {
    userId: metadata.clerkUserId,
    paymentIntentId,
    credits: product.credits,
  });
  if (!result || !["granted", "duplicate"].includes(result.status)) {
    throw failure(500, "TOPUP_GRANT_RESULT_INVALID");
  }
  const deletionClaimToken = metadata.premivateDeletionClaimToken;
  if (typeof deletionClaimToken === "string" && deletionClaimToken) {
    const { data, error } = await supabase.rpc("premivate_self_service_checkout_finish", {
      p_clerk_user_id: metadata.clerkUserId,
      p_claim_token: deletionClaimToken,
      p_stripe_session_id: session.id,
      p_status: "completed",
      p_expires_at: Number.isSafeInteger(session.expires_at)
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
    });
    if (error || !["completed", "ignored"].includes(data?.status)) {
      throw failure(503, "TOPUP_CHECKOUT_CLAIM_FINISH_FAILED");
    }
  }
  return { status: result.status };
}

function sessionCustomerId(customer) {
  if (typeof customer === "string" && customer) return customer;
  return typeof customer?.id === "string" && customer.id ? customer.id : null;
}
