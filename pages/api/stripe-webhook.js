import Stripe from "stripe";
import { saveStripeCustomerId, supabase, updateStripeSubscription } from "../../lib/pro";
import { grantPaidPeriod } from "../../lib/credit-ledger";
import { processPaidCreditTopup } from "../../lib/credit-topup";
import { persistCheckoutMarketData } from "../../lib/stripe-market-data";
import { processStripeChargeRefund } from "../../lib/stripe-refunds";
import { stripeEventMatchesEnvironment } from "../../lib/stripe-mode";
import { isAccountDeletionMarked } from "../../lib/account-deletion";
import { validateCompletedCheckoutEligibility } from "../../lib/prepayment-eligibility";
import { SERVER_FINALIZED_CHECKOUT_FLOW, validateServerFinalizedEligibilityMetadata } from "../../lib/server-finalized-eligibility";
import {
  markContractConfirmationExpired,
  markContractConfirmationRefundReview,
  recordPaidContractConfirmation,
  recordPaidServerFinalizedContractConfirmation,
} from "../../lib/contract-confirmation";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
}

function stripeObjectId(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.id === "string") return value.id;
  return null;
}

function creditGrantFailure(code) {
  const error = new Error(code);
  error.safeCode = code;
  return error;
}

function safeWebhookErrorCode(error) {
  const code = error?.safeCode || error?.code;
  return typeof code === "string" && /^[A-Z0-9_]{1,64}$/.test(code)
    ? code
    : "CREDIT_GRANT_FAILED";
}

async function processPaidProInvoice(event, stripe) {
  if (
    !stripeEventMatchesEnvironment(event, process.env) ||
    !event ||
    event.type !== "invoice.payment_succeeded" ||
    typeof event.id !== "string" ||
    !event.id
  ) {
    throw creditGrantFailure("CREDIT_EVENT_INVALID");
  }

  const eventInvoice = event.data?.object;
  if (
    eventInvoice?.object !== "invoice" ||
    typeof eventInvoice.id !== "string" ||
    !eventInvoice.id
  ) {
    throw creditGrantFailure("CREDIT_EVENT_INVOICE_INVALID");
  }

  // Retrieve the canonical invoice using this release's pinned SDK API version.
  const invoice = await stripe.invoices.retrieve(eventInvoice.id, {
    expand: ["payments.data.payment.payment_intent"],
  });
  if (!invoice || invoice.id !== eventInvoice.id) {
    throw creditGrantFailure("CREDIT_INVOICE_LOOKUP_MISMATCH");
  }

  const periodKindByReason = {
    subscription_create: "initial",
    subscription_cycle: "cycle",
  };
  const periodKind = periodKindByReason[invoice.billing_reason];
  if (!periodKind) return { status: "ignored" };

  // Only a fully paid, nonzero invoice can earn subscription credits.
  if (
    invoice.status !== "paid" ||
    invoice.amount_remaining !== 0 ||
    !Number.isSafeInteger(invoice.amount_paid) ||
    invoice.amount_paid !== 2400 ||
    invoice.currency !== "chf"
  ) {
    return { status: "ignored" };
  }

  const subscriptionId = stripeObjectId(
    invoice.parent?.subscription_details?.subscription
  );
  if (!subscriptionId) return { status: "ignored" };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });
  if (!subscription || subscription.id !== subscriptionId) {
    throw creditGrantFailure("CREDIT_SUBSCRIPTION_LOOKUP_MISMATCH");
  }

  // A subscription without the Clerk metadata used by our Checkout is unrelated.
  const userId = subscription.metadata?.clerkUserId;
  if (typeof userId !== "string" || !userId.trim()) {
    return { status: "ignored" };
  }

  const checkoutFlow = subscription.metadata?.premivateCheckoutFlow;
  if (checkoutFlow === SERVER_FINALIZED_CHECKOUT_FLOW) {
    if (periodKind === "initial" && !Number.isSafeInteger(event.created)) {
      await placeServerFinalizedProInRefundReview({ eventId: event.id, subscription, stripe });
      return { status: "refund_review" };
    }
    const eligibility = validateServerFinalizedEligibilityMetadata(subscription.metadata, {
      eventCreated: event.created,
      enforceExpiry: periodKind === "initial",
      requireActivated: false,
    });
    if (eligibility.status !== "eligible") {
      await placeServerFinalizedProInRefundReview({ eventId: event.id, subscription, stripe });
      return { status: "refund_review" };
    }
  } else if (checkoutFlow === "r1-location-v1") {
    const sessions = await stripe.checkout.sessions.list({ subscription: subscriptionId, limit: 10 });
    const matches = Array.isArray(sessions?.data)
      ? sessions.data.filter((item) => item?.metadata?.premivateCheckoutFlow === "r1-location-v1")
      : [];
    const checkoutSession = matches.length === 1 && sessions?.has_more !== true
      ? await stripe.checkout.sessions.retrieve(matches[0].id)
      : null;
    const eligibility = checkoutSession
      ? validateCompletedCheckoutEligibility(checkoutSession, {
        eventCreated: event.created,
        enforceExpiry: periodKind === "initial",
      })
      : { status: "refund_review" };
    if (eligibility.status !== "eligible") {
      await placeProCheckoutInRefundReview({
        eventId: event.id,
        eventCreated: event.created,
        invoiceId: invoice.id,
        session: checkoutSession,
        subscription,
        stripe,
      });
      return { status: "refund_review" };
    }
  }

  if (await isAccountDeletionMarked(supabase, userId, process.env)) {
    return { status: "suppressed_account_deletion" };
  }

  if (
    stripeObjectId(invoice.customer) !== stripeObjectId(subscription.customer) ||
    invoice.livemode !== subscription.livemode
  ) {
    throw creditGrantFailure("CREDIT_INVOICE_SUBSCRIPTION_MISMATCH");
  }

  const subscriptionItems = subscription.items?.data;
  if (
    !Array.isArray(subscriptionItems) ||
    subscription.items?.has_more === true ||
    subscriptionItems.length !== 1
  ) {
    throw creditGrantFailure("CREDIT_PRO_SUBSCRIPTION_ITEMS_INVALID");
  }

  const subscriptionItem = subscriptionItems[0];
  const price = subscriptionItem?.price;
  const product = price?.product;
  if (
    !price ||
    price.type !== "recurring" ||
    price.currency !== "chf" ||
    price.unit_amount !== 2400 ||
    price.recurring?.interval !== "month" ||
    price.recurring?.interval_count !== 1 ||
    !product ||
    typeof product !== "object" ||
    product.deleted ||
    product.name !== "Premivate Pro"
  ) {
    throw creditGrantFailure("CREDIT_PRO_PRICE_MISMATCH");
  }

  const invoiceLines = invoice.lines?.data;
  if (!Array.isArray(invoiceLines) || invoice.lines?.has_more === true) {
    throw creditGrantFailure("CREDIT_INVOICE_LINES_INCOMPLETE");
  }

  const matchingLines = invoiceLines.filter((line) => {
    const details = line.parent?.subscription_item_details;
    return (
      line.parent?.type === "subscription_item_details" &&
      details?.subscription === subscriptionId &&
      details?.subscription_item === subscriptionItem.id &&
      details.proration === false
    );
  });

  if (matchingLines.length !== 1) {
    throw creditGrantFailure("CREDIT_PRO_INVOICE_LINE_MISMATCH");
  }

  const line = matchingLines[0];
  const linePriceId = stripeObjectId(line.pricing?.price_details?.price);
  if (
    linePriceId !== price.id ||
    line.currency !== "chf" ||
    line.quantity !== 1 ||
    !Number.isSafeInteger(line.period?.start) ||
    !Number.isSafeInteger(line.period?.end) ||
    line.period.end <= line.period.start
  ) {
    throw creditGrantFailure("CREDIT_PRO_INVOICE_PERIOD_INVALID");
  }

  if (checkoutFlow === SERVER_FINALIZED_CHECKOUT_FLOW && periodKind === "initial") {
    const confirmationId = subscription.metadata?.premivateContractConfirmationId;
    const invoicePaymentIntentId = stripeObjectId(invoice.payments?.data?.[0]?.payment?.payment_intent) ||
      stripeObjectId(invoice.payment_intent);
    if (!confirmationId || !invoicePaymentIntentId || !Number.isSafeInteger(event.created)) {
      await placeServerFinalizedProInRefundReview({ eventId: event.id, subscription, stripe });
      return { status: "refund_review" };
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(invoicePaymentIntentId, { expand: ["payment_method"] });
    const customer = await stripe.customers.retrieve(stripeObjectId(subscription.customer));
    const paymentMethod = typeof paymentIntent?.payment_method === "object"
      ? paymentIntent.payment_method
      : null;
    const expectedMetadata = subscription.metadata || {};
    const actualMetadata = paymentIntent?.metadata || {};
    const paymentCountry = String(paymentMethod?.billing_details?.address?.country || "").toUpperCase();
    const customerCountry = String(customer?.address?.country || "").toUpperCase();
    if (paymentIntent?.status !== "succeeded" || paymentIntent.amount_received !== invoice.amount_paid ||
        paymentIntent.amount !== 2400 || paymentIntent.currency !== "chf" ||
        stripeObjectId(paymentIntent.customer) !== stripeObjectId(subscription.customer) ||
        paymentIntent.livemode !== subscription.livemode || paymentMethod?.type !== "card" ||
        paymentCountry !== expectedMetadata.premivateEligibilityBillingCountry ||
        customerCountry !== expectedMetadata.premivateEligibilityBillingCountry ||
        actualMetadata.premivateCheckoutFlow !== SERVER_FINALIZED_CHECKOUT_FLOW ||
        actualMetadata.premivateContractConfirmationId !== confirmationId ||
        actualMetadata.clerkUserId !== userId) {
      await placeServerFinalizedProInRefundReview({ eventId: event.id, subscription, stripe });
      return { status: "refund_review" };
    }
    const { data: confirmation, error: confirmationError } = await supabase.from("premivate_contract_confirmations")
      .select("id,clerk_user_id,service_type,state,purchase_snapshot,stripe_confirmation_token_id,stripe_payment_intent_id,stripe_subscription_id,stripe_customer_id")
      .eq("id", confirmationId)
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (confirmationError || !confirmation || confirmation.service_type !== "pro" ||
        !confirmation.stripe_confirmation_token_id || confirmation.purchase_snapshot?.amount !== 2400 ||
        confirmation.stripe_customer_id !== stripeObjectId(subscription.customer) ||
        confirmation.stripe_subscription_id && confirmation.stripe_subscription_id !== subscriptionId ||
        confirmation.stripe_payment_intent_id && confirmation.stripe_payment_intent_id !== paymentIntent.id) {
      await placeServerFinalizedProInRefundReview({ eventId: event.id, subscription, stripe });
      return { status: "refund_review" };
    }
    await recordPaidServerFinalizedContractConfirmation(supabase, {
      paymentIntent,
      customer,
      marketData: {
        billingCountry: expectedMetadata.premivateEligibilityBillingCountry,
        buyerType: expectedMetadata.premivateBuyerType,
        taxIdProvided: false,
      },
      userId,
      expectedServiceType: "pro",
      paidAt: new Date(event.created * 1000).toISOString(),
      subscriptionId,
      invoiceId: invoice.id,
    });
  }

  const grant = await grantPaidPeriod(supabase, {
    userId,
    subscriptionId,
    invoiceId: invoice.id,
    eventId: event.id,
    periodKind,
    periodStart: new Date(line.period.start * 1000).toISOString(),
    periodEnd: new Date(line.period.end * 1000).toISOString(),
  });

  if (checkoutFlow === SERVER_FINALIZED_CHECKOUT_FLOW && periodKind === "initial") {
    const claimToken = subscription.metadata?.premivateCheckoutClaim;
    const { error } = await supabase.rpc("premivate_subscription_checkout_complete_subscription", {
      p_clerk_user_id: userId,
      p_claim_token: claimToken,
      p_stripe_subscription_id: subscriptionId,
    });
    if (error) throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_LOCK_UPDATE_FAILED");
  }

  const acceptedStatuses = new Set([
    "granted_initial",
    "granted_cycle",
    "granted_paid_gap",
    "duplicate",
  ]);
  if (!grant || !acceptedStatuses.has(grant.status)) {
    throw creditGrantFailure("CREDIT_GRANT_RESULT_INVALID");
  }

  await updateStripeSubscription(userId, {
    subscriptionId,
    customerId: stripeObjectId(subscription.customer),
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
    livemode: subscription.livemode,
    paidThrough: new Date(line.period.end * 1000).toISOString(),
    contractConfirmationId: subscription.metadata?.premivateContractConfirmationId || null,
  });

  return { status: grant.status };
}

async function syncSubscriptionStatus(subscriptionId, stripe) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });
  if (!subscription || subscription.id !== subscriptionId ||
      subscription.livemode !== (process.env.VERCEL_ENV === "production")) {
    throw creditGrantFailure("STRIPE_SUBSCRIPTION_LOOKUP_MISMATCH");
  }
  const userId = subscription.metadata?.clerkUserId;
  if (typeof userId !== "string" || !userId.trim()) return { status: "ignored" };
  if (await isAccountDeletionMarked(supabase, userId, process.env)) {
    return { status: "suppressed_account_deletion" };
  }
  const customerId = stripeObjectId(subscription.customer);
  if (!customerId) throw creditGrantFailure("STRIPE_SUBSCRIPTION_CUSTOMER_MISSING");

  await updateStripeSubscription(userId, {
    subscriptionId,
    customerId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
    livemode: subscription.livemode,
    immediateEnd: subscription.status === "canceled" && subscription.cancel_at_period_end !== true,
    contractConfirmationId: subscription.metadata?.premivateContractConfirmationId || null,
  });
  return { status: "updated" };
}

async function placeProCheckoutInRefundReview({ eventId, eventCreated, invoiceId = null, session, subscription, stripe }) {
  const confirmationId = session?.metadata?.premivateContractConfirmationId ||
    subscription?.metadata?.premivateContractConfirmationId;
  const userId = session?.metadata?.clerkUserId || subscription?.metadata?.clerkUserId;
  if (typeof confirmationId === "string" && confirmationId &&
      typeof userId === "string" && userId &&
      typeof eventId === "string" && eventId) {
    try {
      if (session && Number.isSafeInteger(eventCreated)) {
        await recordPaidContractConfirmation(supabase, {
          session,
          userId,
          expectedServiceType: "pro",
          paidAt: new Date(eventCreated * 1000).toISOString(),
          subscriptionId: stripeObjectId(subscription),
          invoiceId: invoiceId || stripeObjectId(session.invoice),
          refundReview: true,
        });
      } else {
        throw new Error("PRO_REFUND_REVIEW_SNAPSHOT_UNAVAILABLE");
      }
    } catch {
      await markContractConfirmationRefundReview(supabase, {
        confirmationId,
        userId,
        eventId,
      });
    }
  }
  const subscriptionId = stripeObjectId(subscription);
  if (subscriptionId && subscription?.status !== "canceled") {
    const canceled = await stripe.subscriptions.cancel(subscriptionId, {
      invoice_now: false,
      prorate: false,
    });
    if (canceled?.id !== subscriptionId || canceled.status !== "canceled") {
      throw creditGrantFailure("INELIGIBLE_SUBSCRIPTION_CANCELLATION_UNCONFIRMED");
    }
    await syncSubscriptionStatus(subscriptionId, stripe);
  }
}

async function placeServerFinalizedProInRefundReview({ eventId, subscription, stripe }) {
  const confirmationId = subscription?.metadata?.premivateContractConfirmationId;
  const userId = subscription?.metadata?.clerkUserId;
  if (typeof confirmationId === "string" && confirmationId &&
      typeof userId === "string" && userId && typeof eventId === "string" && eventId) {
    await markContractConfirmationRefundReview(supabase, { confirmationId, userId, eventId });
  }
  const subscriptionId = stripeObjectId(subscription);
  if (subscriptionId && subscription?.status !== "canceled") {
    const canceled = await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false });
    if (canceled?.id !== subscriptionId || canceled.status !== "canceled") {
      throw creditGrantFailure("INELIGIBLE_SUBSCRIPTION_CANCELLATION_UNCONFIRMED");
    }
    await syncSubscriptionStatus(subscriptionId, stripe);
  }
  const claimToken = subscription?.metadata?.premivateCheckoutClaim;
  if (typeof userId === "string" && userId && typeof claimToken === "string" && claimToken && subscriptionId) {
    const { error } = await supabase.rpc("premivate_subscription_checkout_release_subscription", {
      p_clerk_user_id: userId,
      p_claim_token: claimToken,
      p_stripe_subscription_id: subscriptionId,
    });
    if (error) throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_LOCK_UPDATE_FAILED");
  }
}

async function recordSubscriptionCheckout(event, stripe) {
  const snapshot = event.data?.object;
  if (snapshot?.mode !== "subscription" || typeof snapshot.id !== "string") {
    return { status: "ignored" };
  }
  const session = await stripe.checkout.sessions.retrieve(snapshot.id, { expand: ["subscription"] });
  const userId = session?.metadata?.clerkUserId;
  const claimToken = session?.metadata?.premivateCheckoutClaim;
  const customerId = stripeObjectId(session?.customer);
  const subscriptionId = stripeObjectId(session?.subscription);
  if (session?.id !== snapshot.id || session.mode !== "subscription" ||
      session.status !== "complete" || session.payment_status !== "paid" ||
      session.livemode !== event.livemode ||
      typeof userId !== "string" || !userId.trim() ||
      typeof claimToken !== "string" || !claimToken ||
      !customerId || !subscriptionId) {
    throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_VALIDATION_FAILED");
  }
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (!subscription || subscription.id !== subscriptionId ||
      subscription.metadata?.clerkUserId !== userId ||
      stripeObjectId(subscription.customer) !== customerId ||
      subscription.livemode !== session.livemode) {
    throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_SUBSCRIPTION_MISMATCH");
  }
  if (session.metadata?.premivateCheckoutFlow === "r1-location-v1") {
    const eligibility = validateCompletedCheckoutEligibility(session, {
      eventCreated: event.created,
    });
    if (eligibility.status !== "eligible") {
      await placeProCheckoutInRefundReview({
        eventId: event.id,
        eventCreated: event.created,
        invoiceId: stripeObjectId(session.invoice),
        session,
        subscription,
        stripe,
      });
      const { error } = await supabase.rpc("premivate_subscription_checkout_complete", {
        p_clerk_user_id: userId,
        p_claim_token: claimToken,
        p_stripe_session_id: session.id,
      });
      if (error) throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_LOCK_UPDATE_FAILED");
      return { status: "refund_review" };
    }
  }
  if (await isAccountDeletionMarked(supabase, userId, process.env)) {
    const cancelled = subscription.status === "canceled"
      ? subscription
      : await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false });
    if (cancelled?.id !== subscriptionId || cancelled.status !== "canceled") {
      throw creditGrantFailure("DELETING_ACCOUNT_SUBSCRIPTION_CANCELLATION_UNCONFIRMED");
    }
    return { status: "suppressed_account_deletion" };
  }
  await persistCheckoutMarketData({
    session,
    stripe,
    subscriptionId,
    invoiceId: stripeObjectId(session.invoice),
  });
  const confirmationId = session.metadata?.premivateContractConfirmationId;
  if (confirmationId) {
    if (subscription.metadata?.premivateContractConfirmationId !== confirmationId ||
        typeof event.created !== "number") {
      throw creditGrantFailure("SUBSCRIPTION_CONTRACT_CONFIRMATION_MISMATCH");
    }
    await recordPaidContractConfirmation(supabase, {
      session,
      userId,
      expectedServiceType: "pro",
      paidAt: new Date(event.created * 1000).toISOString(),
      subscriptionId,
      invoiceId: stripeObjectId(session.invoice),
    });
  }
  const { error } = await supabase.rpc("premivate_subscription_checkout_complete", {
    p_clerk_user_id: userId,
    p_claim_token: claimToken,
    p_stripe_session_id: session.id,
  });
  if (error) throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_LOCK_UPDATE_FAILED");
  await saveStripeCustomerId(userId, customerId);
  return { status: "confirmed_pending_paid_invoice" };
}

async function recordFailedInvoice(event, stripe) {
  const snapshot = event.data?.object;
  if (snapshot?.object !== "invoice" || typeof snapshot.id !== "string") {
    throw creditGrantFailure("FAILED_INVOICE_INVALID");
  }
  const invoice = await stripe.invoices.retrieve(snapshot.id);
  if (!invoice || invoice.id !== snapshot.id) throw creditGrantFailure("FAILED_INVOICE_LOOKUP_MISMATCH");
  // A late failure event must not override a subsequently paid invoice.
  if (invoice.status === "paid" || invoice.amount_remaining === 0) return { status: "recovered" };
  const subscriptionId = stripeObjectId(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return { status: "ignored" };
  return syncSubscriptionStatus(subscriptionId, stripe);
}

async function releaseExpiredCheckout(event) {
  const session = event.data?.object;
  const userId = session?.metadata?.clerkUserId;
  const claimToken = session?.metadata?.premivateCheckoutClaim;
  if (session?.mode === "payment" &&
      session?.metadata?.premivateCheckoutType === "credit_topup") {
    if (typeof session.metadata?.premivateContractConfirmationId === "string" &&
        typeof userId === "string" && typeof session.id === "string") {
      await markContractConfirmationExpired(
        supabase,
        session.metadata.premivateContractConfirmationId,
        userId,
        session.id
      );
    }
    const deletionClaimToken = session?.metadata?.premivateDeletionClaimToken;
    if (typeof userId !== "string" || !userId || typeof deletionClaimToken !== "string" ||
        !deletionClaimToken || typeof session.id !== "string") {
      return { status: "ignored" };
    }
    if (await isAccountDeletionMarked(supabase, userId, process.env)) {
      return { status: "suppressed_account_deletion" };
    }
    const { data, error } = await supabase.rpc("premivate_self_service_checkout_finish", {
      p_clerk_user_id: userId,
      p_claim_token: deletionClaimToken,
      p_stripe_session_id: session.id,
      p_status: "released",
      p_expires_at: Number.isSafeInteger(session.expires_at)
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
    });
    if (error || !["released", "ignored"].includes(data?.status)) {
      throw creditGrantFailure("TOPUP_CHECKOUT_CLAIM_RELEASE_FAILED");
    }
    return { status: data.status };
  }
  if (session?.mode !== "subscription" || typeof userId !== "string" ||
      typeof claimToken !== "string" || !claimToken || typeof session.id !== "string") {
    return { status: "ignored" };
  }
  if (typeof session.metadata?.premivateContractConfirmationId === "string") {
    await markContractConfirmationExpired(
      supabase,
      session.metadata.premivateContractConfirmationId,
      userId,
      session.id
    );
  }
  if (await isAccountDeletionMarked(supabase, userId, process.env)) {
    return { status: "suppressed_account_deletion" };
  }
  const { data, error } = await supabase.rpc("premivate_subscription_checkout_release_expired", {
    p_clerk_user_id: userId,
    p_claim_token: claimToken,
    p_stripe_session_id: session.id,
  });
  if (error) throw creditGrantFailure("SUBSCRIPTION_CHECKOUT_LOCK_UPDATE_FAILED");
  return { status: data?.status || "released" };
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const sig = req.headers["stripe-signature"];

  let event;
  let stripe;

  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const buf = await readRawBody(req);

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (!stripeEventMatchesEnvironment(event, process.env)) {
      return res.status(400).json({ received: false, error: "STRIPE_MODE_MISMATCH" });
    }
  } catch (err) {
    console.error("Stripe webhook signature or configuration check failed");
    return res.status(400).json({ received: false });
  }

  const eventObjectMetadata = event.data?.object?.metadata || {};
  const isLegacyTopupSession = event.type === "checkout.session.completed" &&
    eventObjectMetadata.premivateCheckoutType === "credit_topup";
  const isServerFinalizedTopupPayment = event.type === "payment_intent.succeeded" &&
    eventObjectMetadata.premivateCheckoutType === "credit_topup" &&
    eventObjectMetadata.premivateCheckoutFlow === SERVER_FINALIZED_CHECKOUT_FLOW;
  if (isLegacyTopupSession || isServerFinalizedTopupPayment) {
    try {
      const result = await processPaidCreditTopup({
        event,
        stripe,
        supabase,
        env: process.env,
        isDeletionInProgress: (userId) => isAccountDeletionMarked(supabase, userId, process.env),
      });
      return res.status(200).json({ received: true, topupGrantStatus: result.status });
    } catch (error) {
      console.error("Stripe top-up grant failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  if (event.type === "checkout.session.completed") {
    try {
      await recordSubscriptionCheckout(event, stripe);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe subscription checkout confirmation failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  if (event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted") {
    try {
      const id = stripeObjectId(event.data?.object);
      if (id) await syncSubscriptionStatus(id, stripe);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe subscription lifecycle update failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  if (event.type === "invoice.payment_failed") {
    try {
      const result = await recordFailedInvoice(event, stripe);
      return res.status(200).json({ received: true, paymentStatus: result.status });
    } catch (error) {
      console.error("Stripe failed-payment update failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  if (event.type === "checkout.session.expired") {
    try {
      const result = await releaseExpiredCheckout(event);
      return res.status(200).json({ received: true, checkoutStatus: result.status });
    } catch (error) {
      console.error("Stripe expired-checkout update failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  if (event.type === "charge.refunded") {
    try {
      const result = await processStripeChargeRefund({
        event,
        stripe,
        supabase,
        env: process.env,
        isDeletionInProgress: (userId) => isAccountDeletionMarked(supabase, userId, process.env),
      });
      if (result.contractConfirmationId && result.userId) {
        await markContractConfirmationRefundReview(supabase, {
          confirmationId: result.contractConfirmationId,
          userId: result.userId,
          eventId: event.id,
        });
      }
      return res.status(200).json({ received: true, refundStatus: result.status });
    } catch (error) {
      console.error("Stripe refund processing failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    try {
      const result = await processPaidProInvoice(event, stripe);
      return res.status(200).json({
        received: true,
        creditGrantStatus: result.status,
      });
    } catch (error) {
      console.error("Stripe credit grant failed", {
        eventId: typeof event.id === "string" ? event.id : null,
        code: safeWebhookErrorCode(error),
      });
      return res.status(500).json({ received: false });
    }
  }

  return res.status(200).json({
    received: true,
  });
}
