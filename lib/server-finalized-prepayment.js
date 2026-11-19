import { isPremivateOwner } from "./pro";
import { createContractConfirmationDraft } from "./contract-confirmation";
import { createCheckoutTermsConsent } from "./checkout-terms-consent";
import { evaluatePrepaymentEligibility, getPrepaymentEligibilityMetadata } from "./prepayment-eligibility";
import { SERVER_FINALIZED_CHECKOUT_FLOW } from "./server-finalized-eligibility";
import { getCreditTopupPackage, isTopupSalesEnabled, validateTopupBalance } from "./credit-topup";

const TOKEN_MAX_AGE_MS = 10 * 60 * 1000;
const BLOCKING_SUBSCRIPTION_STATUSES = new Set([
  "active", "trialing", "past_due", "unpaid", "incomplete", "paused",
]);

function failure(status, code) {
  const error = new Error(code);
  error.status = status;
  error.safeCode = code;
  return error;
}

function stripeId(value) {
  if (typeof value === "string" && value) return value;
  return typeof value?.id === "string" ? value.id : null;
}

function normalizeCountry(value) {
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function getServerIpCountry(req) {
  const value = req?.headers?.["x-vercel-ip-country"];
  return normalizeCountry(Array.isArray(value) ? value[0] : value);
}

function customerTokenDetails(token) {
  const preview = token?.payment_method_preview;
  const billing = preview?.billing_details;
  const address = billing?.address;
  const country = normalizeCountry(address?.country);
  if (preview?.type !== "card" || !country || typeof billing?.name !== "string" ||
      !billing.name.trim() || typeof billing?.email !== "string" || !billing.email.trim() ||
      typeof address?.line1 !== "string" || !address.line1.trim() ||
      typeof address?.city !== "string" || !address.city.trim() ||
      typeof address?.postal_code !== "string" || !address.postal_code.trim()) {
    throw failure(400, "CONFIRMATION_TOKEN_BILLING_DETAILS_INVALID");
  }
  return {
    country,
    name: billing.name.trim(),
    email: billing.email.trim(),
    phone: typeof billing.phone === "string" ? billing.phone : null,
    address: {
      line1: address.line1,
      line2: typeof address.line2 === "string" ? address.line2 : "",
      city: address.city,
      state: typeof address.state === "string" ? address.state : "",
      postal_code: address.postal_code,
      country,
    },
  };
}

export async function createServerFinalizedPrepaymentDraft({
  serviceType,
  userId,
  requestBody = {},
  env = process.env,
  supabase,
  stripe,
  getCustomerId,
  createCustomer,
  saveCustomerId,
  getPlan,
  isProPlan,
  getBalance,
}) {
  if (!userId || typeof userId !== "string") throw failure(401, "AUTH_REQUIRED");
  if (!supabase || !stripe) throw failure(503, "BILLING_UNAVAILABLE");
  if (isPremivateOwner(userId)) {
    throw failure(403, serviceType === "pro" ? "OWNER_DOES_NOT_NEED_SUBSCRIPTION" : "OWNER_DOES_NOT_NEED_TOPUPS");
  }

  const termsConsent = createCheckoutTermsConsent({
    accepted: requestBody.termsAccepted,
    locale: requestBody.termsLocale,
    marketCountryScope: requestBody.marketCountryScope,
    marketRegion: requestBody.marketRegion,
    buyerType: requestBody.buyerType,
    frenchVersionPresented: requestBody.frenchVersionPresented,
    alternativeLanguageChoice: requestBody.alternativeLanguageChoice,
    env,
  });
  if (typeof requestBody.earlyStartRequested !== "boolean") throw failure(400, "EARLY_START_REQUEST_REQUIRED");

  let product;
  if (serviceType === "credit_topup") {
    if (!isTopupSalesEnabled(env)) throw failure(503, "TOPUP_SALES_DISABLED");
    product = getCreditTopupPackage(requestBody.packageId);
    if (!product) throw failure(400, "TOPUP_PACKAGE_INVALID");
    let plan;
    try { plan = await getPlan(userId); } catch { throw failure(503, "PLAN_UNAVAILABLE"); }
    if (!(typeof isProPlan === "function" ? isProPlan(plan) : String(plan || "").toLowerCase().includes("pro"))) {
      throw failure(403, "PRO_REQUIRED");
    }
    let balance;
    try { balance = await getBalance(userId); } catch { throw failure(503, "TOPUP_BALANCE_UNAVAILABLE"); }
    validateTopupBalance(balance);
    if (balance.creditAccessBlocked === true) throw failure(403, "CREDIT_ACCOUNT_RESTRICTED");
  } else if (serviceType === "pro") {
    product = { amount: 2400, currency: "chf", label: "Premivate Pro", interval: "month", intervalCount: 1 };
  } else {
    throw failure(400, "PREPAYMENT_SERVICE_TYPE_INVALID");
  }

  let customerId;
  try { customerId = await getCustomerId(userId); } catch { throw failure(503, "STRIPE_CUSTOMER_UNAVAILABLE"); }
  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.id !== customerId || customer.deleted === true) customerId = null;
  }
  if (!customerId) {
    const customer = await createCustomer(userId);
    customerId = stripeId(customer);
    if (!customerId) throw failure(502, "STRIPE_CUSTOMER_INVALID");
    await saveCustomerId(userId, customerId);
  }

  if (serviceType === "pro") {
    const [subscriptions, openSessions] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 }),
      stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 }),
    ]);
    if (subscriptions?.has_more === true || openSessions?.has_more === true) throw failure(503, "SUBSCRIPTION_LOOKUP_INCOMPLETE");
    if ((subscriptions?.data || []).some((item) => BLOCKING_SUBSCRIPTION_STATUSES.has(item.status))) {
      throw failure(409, "SUBSCRIPTION_ALREADY_EXISTS");
    }
    if ((openSessions?.data || []).some((item) => item.mode === "subscription" && item.metadata?.clerkUserId === userId)) {
      throw failure(409, "SUBSCRIPTION_CHECKOUT_ALREADY_OPEN");
    }
  }

  const purchaseSnapshot = serviceType === "pro"
    ? { serviceType, amount: 2400, currency: "chf", productLabel: "Premivate Pro", interval: "month", intervalCount: 1 }
    : {
      serviceType,
      packageId: requestBody.packageId,
      amount: product.amount,
      currency: "chf",
      productLabel: product.name,
      credits: product.credits,
    };
  const draft = await createContractConfirmationDraft(supabase, {
    userId,
    serviceType,
    locale: termsConsent.locale,
    termsConsent,
    earlyStartRequested: requestBody.earlyStartRequested,
    purchaseSnapshot,
  });
  const { error: customerError } = await supabase.from("premivate_contract_confirmations")
    .update({ stripe_customer_id: customerId })
    .eq("id", draft.id)
    .eq("clerk_user_id", userId)
    .eq("state", "checkout_pending");
  if (customerError) throw failure(503, "CONTRACT_CONFIRMATION_CUSTOMER_ATTACH_FAILED");

  return {
    confirmationId: draft.id,
    serviceType,
    amount: product.amount,
    currency: "chf",
    productLabel: product.name || product.label,
  };
}

export async function attachServerFinalizedEligibility(supabase, {
  confirmationId,
  userId,
  confirmationTokenId,
  eligibility,
}) {
  const { data, error } = await supabase.from("premivate_contract_confirmations")
    .update({ stripe_confirmation_token_id: confirmationTokenId, eligibility_snapshot: eligibility })
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .eq("state", "checkout_pending")
    .eq("payment_status", "pending")
    .is("stripe_confirmation_token_id", null)
    .is("eligibility_snapshot", null)
    .select("id")
    .maybeSingle();
  if (error) throw failure(503, "PREPAYMENT_ELIGIBILITY_STORE_FAILED");
  if (data?.id === confirmationId) return true;

  const { data: existing, error: lookupError } = await supabase.from("premivate_contract_confirmations")
    .select("stripe_confirmation_token_id,eligibility_snapshot")
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (lookupError || existing?.stripe_confirmation_token_id !== confirmationTokenId ||
      stableJson(existing?.eligibility_snapshot) !== stableJson(eligibility)) {
    throw failure(409, "PREPAYMENT_CONFIRMATION_TOKEN_ALREADY_USED");
  }
  return true;
}

export async function finalizeServerPrepayment({
  stripe,
  supabase,
  userId,
  confirmationId,
  confirmationTokenId,
  ipCountry,
  env = process.env,
  getPlan,
  isProPlan,
  getBalance,
  now = () => new Date(),
}) {
  if (!/^ctoken_[A-Za-z0-9]+$/.test(confirmationTokenId || "") ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(confirmationId || "")) {
    throw failure(400, "PREPAYMENT_FINALIZATION_INPUT_INVALID");
  }
  const { data: row, error: readError } = await supabase.from("premivate_contract_confirmations")
    .select("*").eq("id", confirmationId).eq("clerk_user_id", userId).maybeSingle();
  if (readError || !row) throw failure(readError ? 503 : 404, "CONTRACT_CONFIRMATION_NOT_FOUND");
  if (row.state !== "checkout_pending" || row.payment_status !== "pending") {
    throw failure(409, "PREPAYMENT_DRAFT_NOT_OPEN");
  }
  const purchase = row.purchase_snapshot;
  if (!purchase || purchase.serviceType !== row.service_type || purchase.currency !== "chf" ||
      !Number.isSafeInteger(purchase.amount) || !row.stripe_customer_id) {
    throw failure(503, "PREPAYMENT_PURCHASE_SNAPSHOT_INVALID");
  }
  if (row.service_type === "pro" &&
      (typeof env.STRIPE_PRO_PRICE_ID !== "string" || !/^price_[A-Za-z0-9]+$/.test(env.STRIPE_PRO_PRICE_ID))) {
    throw failure(503, "STRIPE_PRO_PRICE_ID_UNAVAILABLE");
  }
  if (row.service_type === "credit_topup") {
    if (!isTopupSalesEnabled(env)) throw failure(503, "TOPUP_SALES_DISABLED");
    let plan;
    let balance;
    try {
      plan = await getPlan(userId);
      balance = await getBalance(userId);
    } catch {
      throw failure(503, "TOPUP_ACCOUNT_STATE_UNAVAILABLE");
    }
    if (!(typeof isProPlan === "function" ? isProPlan(plan) : String(plan || "").toLowerCase().includes("pro"))) {
      throw failure(403, "PRO_REQUIRED");
    }
    validateTopupBalance(balance);
    if (balance.creditAccessBlocked === true) throw failure(403, "CREDIT_ACCOUNT_RESTRICTED");
  }
  const token = await stripe.confirmationTokens.retrieve(confirmationTokenId);
  const tokenCreated = Number.isSafeInteger(token?.created) ? token.created * 1000 : NaN;
  const tokenExpires = Number.isSafeInteger(token?.expires_at) ? token.expires_at * 1000 : NaN;
  let current;
  try { current = now().getTime(); } catch { current = NaN; }
  if (!token || token.id !== confirmationTokenId || token.livemode !== (env.VERCEL_ENV === "production") ||
      !Number.isFinite(tokenCreated) || !Number.isFinite(tokenExpires) ||
      tokenCreated > current || current - tokenCreated > TOKEN_MAX_AGE_MS || current >= tokenExpires) {
    throw failure(400, "CONFIRMATION_TOKEN_INVALID_OR_EXPIRED");
  }
  const confirmationTokenPaymentIntentId = stripeId(token.payment_intent);
  if (confirmationTokenPaymentIntentId && row.stripe_payment_intent_id &&
      confirmationTokenPaymentIntentId !== row.stripe_payment_intent_id) {
    throw failure(409, "PREPAYMENT_CONFIRMATION_TOKEN_ALREADY_USED");
  }
  const billing = customerTokenDetails(token);
  const declaredCountry = row.terms_snapshot?.precontractDisclosure?.marketCountryScope;
  const buyerType = row.terms_snapshot?.precontractDisclosure?.buyerType;
  const decision = evaluatePrepaymentEligibility({
    billingCountry: billing.country,
    declaredCountry,
    ipCountry,
    buyerType,
    now,
  });
  if (decision.status !== "eligible") {
    throw failure(decision.status === "excluded" ? 403 : 422, decision.code);
  }
  const eligibilityMetadata = getPrepaymentEligibilityMetadata(decision);
  const eligibility = {
    ...eligibilityMetadata,
    premivateEligibilityVersion: SERVER_FINALIZED_CHECKOUT_FLOW,
    checkedAt: decision.checkedAt,
    expiresAt: decision.expiresAt,
  };
  await attachServerFinalizedEligibility(supabase, {
    confirmationId,
    userId,
    confirmationTokenId,
    eligibility,
  });

  await stripe.customers.update(row.stripe_customer_id, {
    name: billing.name,
    email: billing.email,
    phone: billing.phone || undefined,
    address: billing.address,
  });

  const metadata = {
    clerkUserId: userId,
    premivateCheckoutFlow: SERVER_FINALIZED_CHECKOUT_FLOW,
    premivateContractConfirmationId: confirmationId,
    premivateEarlyStartRequested: String(row.early_start_requested),
    premivateEarlyStartRequestedAt: row.early_start_requested_at || "",
    premivateEarlyStartVersion: row.confirmation_version,
    premivateTermsVersion: row.terms_version,
    premivateTermsLocale: row.terms_locale,
    premivateTermsAcceptedAt: row.terms_accepted_at,
    premivatePrecontractMarketScope: declaredCountry,
    premivatePrecontractRegion: row.terms_snapshot?.precontractDisclosure?.marketRegion || "",
    premivateBuyerType: buyerType,
    premivateFrenchTermsPresented: String(row.terms_snapshot?.precontractDisclosure?.frenchVersionPresented === true),
    premivateAlternativeLanguageChoice: String(row.terms_snapshot?.precontractDisclosure?.alternativeLanguageChoice === true),
    premivateEligibilityVersion: SERVER_FINALIZED_CHECKOUT_FLOW,
    premivateEligibilityStatus: "approved",
    premivateEligibilityBillingCountry: decision.billingCountry,
    premivateEligibilityIpCountry: decision.ipCountry,
    premivateEligibilityCheckedAt: decision.checkedAt,
    premivateEligibilityExpiresAt: decision.expiresAt,
    premivateEligibilityEvidence: "confirmation_token_billing_country+server_ip_country",
  };

  let paymentIntent;
  let subscriptionId = null;
  let claimToken = null;
  if (row.service_type === "credit_topup") {
    const product = getCreditTopupPackage(purchase.packageId);
    if (!product || product.amount !== purchase.amount || product.credits !== purchase.credits) {
      throw failure(503, "PREPAYMENT_TOPUP_SNAPSHOT_INVALID");
    }
    Object.assign(metadata, {
      premivateCheckoutType: "credit_topup",
      creditPackage: purchase.packageId,
      credits: String(product.credits),
    });
    const accountDeletionGuard = env.PREMIVATE_SELF_SERVICE_ACCOUNT_DELETION_ENABLED === "true";
    if (accountDeletionGuard) {
      claimToken = confirmationId;
      const { data, error } = await supabase.rpc("premivate_self_service_checkout_claim", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_operation: "credit_topup",
      });
      if (error || data?.status !== "claimed") throw failure(409, "ACCOUNT_DELETION_IN_PROGRESS_OR_CHECKOUT_BUSY");
      metadata.premivateDeletionClaimToken = claimToken;
    }
    const existingPaymentIntentId = row.stripe_payment_intent_id || confirmationTokenPaymentIntentId;
    paymentIntent = existingPaymentIntentId
      ? await stripe.paymentIntents.retrieve(existingPaymentIntentId)
      : await stripe.paymentIntents.create({
        amount: product.amount,
        currency: "chf",
        customer: row.stripe_customer_id,
        payment_method_types: ["card"],
        confirmation_token: confirmationTokenId,
        confirm: true,
        description: product.name,
        metadata,
      }, { idempotencyKey: `premivate-topup-${confirmationId}` });
    if (!paymentIntent?.id || paymentIntent.customer !== row.stripe_customer_id ||
        paymentIntent.amount !== product.amount || paymentIntent.currency !== "chf" ||
        paymentIntent.livemode !== (env.VERCEL_ENV === "production")) {
      throw failure(502, "PREPAYMENT_PAYMENT_INTENT_INVALID");
    }
    if (accountDeletionGuard) {
      const expiresAt = new Date((tokenExpires + 5 * 60 * 1000));
      const { data, error } = await supabase.rpc("premivate_self_service_checkout_attach", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_stripe_session_id: paymentIntent.id,
        p_expires_at: expiresAt.toISOString(),
      });
      if (error || data?.status !== "attached") throw failure(503, "ACCOUNT_DELETION_CHECKOUT_GUARD_UNAVAILABLE");
    }
  } else {
    const priceId = env.STRIPE_PRO_PRICE_ID;
    if (typeof priceId !== "string" || !/^price_[A-Za-z0-9]+$/.test(priceId)) {
      throw failure(503, "STRIPE_PRO_PRICE_ID_UNAVAILABLE");
    }
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const priceProduct = price?.product;
    if (!price || price.id !== priceId || price.active !== true || price.livemode !== (env.VERCEL_ENV === "production") ||
        price.currency !== "chf" || price.unit_amount !== 2400 || price.type !== "recurring" ||
        price.recurring?.interval !== "month" || price.recurring?.interval_count !== 1 ||
        !priceProduct || typeof priceProduct !== "object" || priceProduct.deleted === true ||
        priceProduct.active !== true || priceProduct.name !== "Premivate Pro") {
      throw failure(503, "STRIPE_PRO_PRICE_MISMATCH");
    }
    claimToken = confirmationId;
    const claim = await supabase.rpc("premivate_subscription_checkout_claim", {
      p_clerk_user_id: userId,
      p_claim_token: claimToken,
    });
    if (claim.error || claim.data?.status !== "claimed") throw failure(409, "SUBSCRIPTION_CHECKOUT_ALREADY_OPEN");
    metadata.premivateCheckoutClaim = claimToken;
    const [subscriptions, openSessions] = await Promise.all([
      stripe.subscriptions.list({ customer: row.stripe_customer_id, status: "all", limit: 100 }),
      stripe.checkout.sessions.list({ customer: row.stripe_customer_id, status: "open", limit: 100 }),
    ]);
    const ownPendingSubscription = (subscriptions?.data || []).find((item) =>
      item?.metadata?.premivateCheckoutFlow === SERVER_FINALIZED_CHECKOUT_FLOW &&
      item?.metadata?.premivateContractConfirmationId === confirmationId
    );
    if (subscriptions?.has_more === true || openSessions?.has_more === true ||
        (subscriptions?.data || []).some((item) => item.id !== ownPendingSubscription?.id && BLOCKING_SUBSCRIPTION_STATUSES.has(item.status)) ||
        (openSessions?.data || []).some((item) => item.mode === "subscription" && item.metadata?.clerkUserId === userId)) {
      await supabase.rpc("premivate_subscription_checkout_release", { p_clerk_user_id: userId, p_claim_token: claimToken });
      throw failure(409, "SUBSCRIPTION_ALREADY_EXISTS");
    }
    const subscription = ownPendingSubscription
      ? await stripe.subscriptions.retrieve(ownPendingSubscription.id, { expand: ["latest_invoice.payments"] })
      : await stripe.subscriptions.create({
        customer: row.stripe_customer_id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { payment_method_types: ["card"], save_default_payment_method: "on_subscription" },
        metadata,
        expand: ["latest_invoice.payments"],
      }, { idempotencyKey: `premivate-pro-subscription-${confirmationId}` });
    subscriptionId = subscription?.id || null;
    const { error: claimAttachError } = await supabase.rpc("premivate_subscription_checkout_attach_subscription", {
      p_clerk_user_id: userId,
      p_claim_token: claimToken,
      p_stripe_subscription_id: subscriptionId,
      p_expires_at: new Date(tokenExpires + 5 * 60 * 1000).toISOString(),
    });
    if (claimAttachError || !subscriptionId || subscription.livemode !== (env.VERCEL_ENV === "production")) {
      if (subscriptionId) await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false }).catch(() => {});
      throw failure(503, "SUBSCRIPTION_CHECKOUT_CLAIM_ATTACH_FAILED");
    }
    const latestInvoice = subscription.latest_invoice;
    const latestPayment = latestInvoice?.payments?.data?.[0]?.payment?.payment_intent;
    const paymentIntentId = stripeId(latestPayment);
    if (!paymentIntentId) throw failure(502, "SUBSCRIPTION_INITIAL_PAYMENT_INTENT_MISSING");
    await stripe.paymentIntents.update(paymentIntentId, { metadata });
    const { error: preconfirmStoreError } = await supabase.from("premivate_contract_confirmations")
      .update({ stripe_subscription_id: subscriptionId, stripe_payment_intent_id: paymentIntentId })
      .eq("id", confirmationId)
      .eq("clerk_user_id", userId)
      .eq("state", "checkout_pending")
      .eq("stripe_confirmation_token_id", confirmationTokenId);
    if (preconfirmStoreError) {
      await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false }).catch(() => {});
      await supabase.rpc("premivate_subscription_checkout_release_subscription", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_stripe_subscription_id: subscriptionId,
      }).catch(() => {});
      throw failure(503, "PREPAYMENT_CONFIRMATION_PAYMENT_LINK_FAILED");
    }
    const currentPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (confirmationTokenPaymentIntentId && confirmationTokenPaymentIntentId !== paymentIntentId) {
      await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false }).catch(() => {});
      throw failure(409, "PREPAYMENT_CONFIRMATION_TOKEN_ALREADY_USED");
    }
    if (currentPaymentIntent?.status === "succeeded" || currentPaymentIntent?.status === "requires_action") {
      paymentIntent = currentPaymentIntent;
    } else if (!confirmationTokenPaymentIntentId && ["requires_confirmation", "requires_payment_method"].includes(currentPaymentIntent?.status)) {
      paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        { confirmation_token: confirmationTokenId },
        { idempotencyKey: `premivate-pro-confirm-${confirmationId}` },
      );
    } else {
      await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false }).catch(() => {});
      await supabase.rpc("premivate_subscription_checkout_release_subscription", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_stripe_subscription_id: subscriptionId,
      }).catch(() => {});
      throw failure(402, "SUBSCRIPTION_INITIAL_PAYMENT_REQUIRES_NEW_ATTEMPT");
    }
    if (!paymentIntent?.id || paymentIntent.customer !== row.stripe_customer_id ||
        paymentIntent.currency !== "chf" || paymentIntent.livemode !== (env.VERCEL_ENV === "production")) {
      throw failure(502, "SUBSCRIPTION_INITIAL_PAYMENT_INVALID");
    }
  }

  const updates = {
    stripe_payment_intent_id: paymentIntent.id,
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    livemode: paymentIntent.livemode === true,
    amount_total: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
  const { error: updateError } = await supabase.from("premivate_contract_confirmations")
    .update(updates)
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .eq("state", "checkout_pending")
    .eq("stripe_confirmation_token_id", confirmationTokenId);
  if (updateError) throw failure(503, "PREPAYMENT_CONFIRMATION_PAYMENT_LINK_FAILED");

  return {
    status: paymentIntent.status,
    clientSecret: paymentIntent.status === "requires_action" ? paymentIntent.client_secret : null,
    paymentIntentId: paymentIntent.id,
    subscriptionId,
    confirmationId,
  };
}
