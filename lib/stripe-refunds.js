import { CREDIT_TOPUP_PACKAGES } from "./credit-topup";
import { stripeEventMatchesEnvironment } from "./stripe-mode";

function fail(code) {
  const error = new Error(code);
  error.safeCode = code;
  return error;
}

function objectId(value) {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : null;
}

async function recordManualReview(supabase, input) {
  const { error } = await supabase.rpc("premivate_credit_record_refund_review", {
    p_stripe_event_id: input.eventId,
    p_stripe_charge_id: input.chargeId,
    p_clerk_user_id: input.userId || null,
    p_source_type: input.sourceType || "unresolved",
    p_source_reference_id: input.sourceReferenceId || null,
    p_reason: input.reason,
    p_amount: input.amount,
    p_currency: input.currency,
  });
  if (error) throw fail("REFUND_REVIEW_RECORD_FAILED");
}

async function findTopupSource({ paymentIntent, charge, event, stripe, supabase }) {
  const metadata = paymentIntent.metadata || {};
  if (metadata.premivateCheckoutType !== "credit_topup") return null;
  const product = Object.prototype.hasOwnProperty.call(CREDIT_TOPUP_PACKAGES, metadata.creditPackage)
    ? CREDIT_TOPUP_PACKAGES[metadata.creditPackage]
    : null;
  const userId = metadata.clerkUserId;
  if (!product || metadata.credits !== String(product.credits) ||
      typeof userId !== "string" || !userId.trim() ||
      paymentIntent.amount !== product.amount || paymentIntent.amount_received !== product.amount ||
      paymentIntent.currency !== "chf" || paymentIntent.status !== "succeeded" ||
      objectId(charge.customer) !== objectId(paymentIntent.customer)) {
    throw fail("TOPUP_REFUND_PAYMENT_VALIDATION_FAILED");
  }
  return {
    userId,
    sourceType: "topup",
    sourceReferenceId: paymentIntent.id,
  };
}

async function findSubscriptionSource({ charge, stripe }) {
  const invoiceId = objectId(charge.invoice);
  if (!invoiceId) return null;
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (!invoice || invoice.id !== invoiceId || invoice.status !== "paid" ||
      invoice.amount_remaining !== 0 || invoice.amount_paid !== 2400 ||
      invoice.currency !== "chf" || objectId(invoice.customer) !== objectId(charge.customer)) {
    throw fail("SUBSCRIPTION_REFUND_INVOICE_INVALID");
  }
  const subscriptionId = objectId(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });
  const userId = subscription?.metadata?.clerkUserId;
  const items = subscription?.items?.data;
  const price = items?.length === 1 ? items[0]?.price : null;
  const product = price?.product;
  if (!subscription || subscription.id !== subscriptionId ||
      typeof userId !== "string" || !userId.trim() ||
      objectId(subscription.customer) !== objectId(invoice.customer) ||
      subscription.livemode !== invoice.livemode ||
      !price || price.type !== "recurring" || price.currency !== "chf" ||
      price.unit_amount !== 2400 || price.recurring?.interval !== "month" ||
      price.recurring?.interval_count !== 1 || !product || product.deleted ||
      product.name !== "Premivate Pro") {
    throw fail("SUBSCRIPTION_REFUND_SOURCE_VALIDATION_FAILED");
  }
  return { userId, sourceType: "subscription", sourceReferenceId: invoiceId };
}

export async function processStripeChargeRefund({ event, stripe, supabase, env = process.env, isDeletionInProgress = async () => false }) {
  if (event?.type !== "charge.refunded") return { status: "ignored" };
  if (!stripeEventMatchesEnvironment(event, env)) throw fail("STRIPE_MODE_MISMATCH");

  const snapshot = event.data?.object;
  if (snapshot?.object !== "charge" || typeof snapshot.id !== "string" || !snapshot.id) {
    throw fail("REFUND_CHARGE_INVALID");
  }
  const charge = await stripe.charges.retrieve(snapshot.id, {
    expand: ["payment_intent", "invoice"],
  });
  if (!charge || charge.id !== snapshot.id || charge.livemode !== event.livemode ||
      charge.paid !== true || charge.currency !== "chf" ||
      !Number.isSafeInteger(charge.amount) || !Number.isSafeInteger(charge.amount_refunded) ||
      charge.amount_refunded < 0 || charge.amount_refunded > charge.amount) {
    throw fail("REFUND_CHARGE_VALIDATION_FAILED");
  }

  const paymentIntentId = objectId(charge.payment_intent);
  if (!paymentIntentId) {
    const source = await findSubscriptionSource({ charge, stripe });
    if (source && await isDeletionInProgress(source.userId)) {
      return { status: "suppressed_account_deletion" };
    }
    await recordManualReview(supabase, {
      eventId: event.id,
      chargeId: charge.id,
      userId: source?.userId || null,
      sourceType: source?.sourceType || "unresolved",
      sourceReferenceId: source?.sourceReferenceId || null,
      reason: "PAYMENT_INTENT_MISSING",
      amount: charge.amount_refunded,
      currency: charge.currency,
    });
    return { status: "manual_review", reason: "PAYMENT_INTENT_MISSING" };
  }
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (!paymentIntent || paymentIntent.id !== paymentIntentId ||
      paymentIntent.livemode !== charge.livemode ||
      objectId(paymentIntent.customer) !== objectId(charge.customer)) {
    throw fail("REFUND_PAYMENT_INTENT_MISMATCH");
  }

  const source = await findTopupSource({ paymentIntent, charge, event, stripe, supabase }) ||
    await findSubscriptionSource({ charge, stripe });
  if (!source) {
    await recordManualReview(supabase, {
      eventId: event.id,
      chargeId: charge.id,
      userId: null,
      sourceType: "unresolved",
      sourceReferenceId: objectId(charge.invoice),
      reason: "REFUND_SOURCE_UNRESOLVED",
      amount: charge.amount_refunded,
      currency: charge.currency,
    });
    return { status: "manual_review_unresolved" };
  }

  if (await isDeletionInProgress(source.userId)) {
    return { status: "suppressed_account_deletion" };
  }

  if (charge.amount_refunded !== charge.amount || charge.refunded !== true) {
    await recordManualReview(supabase, {
      eventId: event.id,
      chargeId: charge.id,
      userId: source.userId,
      sourceType: source.sourceType,
      sourceReferenceId: source.sourceReferenceId,
      reason: "PARTIAL_REFUND_REQUIRES_MANUAL_REVIEW",
      amount: charge.amount_refunded,
      currency: charge.currency,
    });
    return { status: "manual_review_partial" };
  }

  const { data, error } = await supabase.rpc("premivate_credit_refund_source", {
    p_clerk_user_id: source.userId,
    p_source_type: source.sourceType,
    p_source_reference_id: source.sourceReferenceId,
    p_stripe_event_id: event.id,
  });
  if (error?.code === "P0002" || error?.message?.includes("CREDIT_REFUND_SOURCE_NOT_FOUND")) {
    await recordManualReview(supabase, {
      eventId: event.id,
      chargeId: charge.id,
      userId: source.userId,
      sourceType: source.sourceType,
      sourceReferenceId: source.sourceReferenceId,
      reason: "CREDIT_SOURCE_NOT_AVAILABLE_FOR_AUTOMATIC_REFUND",
      amount: charge.amount,
      currency: charge.currency,
    });
    return { status: "manual_review_source_unavailable" };
  }
  if (error) throw fail("CREDIT_REFUND_FAILED");
  if (!data || !["refunded", "refunded_with_consumed", "pending", "duplicate"].includes(data.status)) {
    throw fail("CREDIT_REFUND_RESULT_INVALID");
  }
  return { status: data.status, revokedCredits: data.revokedCredits, consumedCredits: data.consumedCredits };
}
