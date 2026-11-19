import { createHash, randomUUID } from "node:crypto";
import { jsPDF } from "jspdf";
import { EU_EARLY_START_COPY } from "../data/contract-confirmation-copy";
import { LEGAL_DOCUMENTS } from "../data/legal-documents";
import { grantPurchasedCredits } from "./credit-ledger";
import { getCheckoutMarketData } from "./stripe-market-data";

export const CONTRACT_CONFIRMATION_VERSION = "eu-service-confirmation-v2";
export const CONTRACT_CONFIRMATION_TABLE = "premivate_contract_confirmations";

const EU_MEMBER_STATES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL",
  "PT", "RO", "SE", "SI", "SK",
]);

function failure(status, code) {
  const error = new Error(code);
  error.status = status;
  error.safeCode = code;
  return error;
}

function isEUConsumer(country, marketData) {
  return EU_MEMBER_STATES.has(country) && marketData?.buyerType === "consumer";
}

function addDays(instant, days) {
  const result = new Date(instant);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}

function sameInstant(left, right) {
  return typeof left === "string" && typeof right === "string" &&
    Number.isFinite(Date.parse(left)) && Number.isFinite(Date.parse(right)) &&
    Date.parse(left) === Date.parse(right);
}

function contractTermsSnapshot(locale, serviceType, earlyStartRequested, expectedTermsVersion, precontractDisclosure) {
  const terms = LEGAL_DOCUMENTS[locale]?.terms;
  const requestCopy = EU_EARLY_START_COPY[locale];
  if (!terms || !requestCopy || !Array.isArray(terms.sections)) {
    throw failure(503, "CONTRACT_TERMS_SNAPSHOT_UNAVAILABLE");
  }
  if (terms.version !== expectedTermsVersion) {
    throw failure(409, "CONTRACT_TERMS_VERSION_CHANGED");
  }
  const requestText = serviceType === "pro" ? requestCopy.proRequest : requestCopy.topupRequest;
  return {
    version: terms.version,
    locale,
    title: terms.title,
    sections: terms.sections,
    earlyStartRequest: earlyStartRequested ? requestText : null,
    earlyStartRequestByService: {
      pro: serviceType === "pro" && earlyStartRequested ? requestCopy.proRequest : null,
      credit_topup: serviceType === "credit_topup" && earlyStartRequested ? requestCopy.topupRequest : null,
    },
    earlyStartRequestVersion: CONTRACT_CONFIRMATION_VERSION,
    precontractDisclosure,
  };
}

export async function createContractConfirmationDraft(supabase, {
  userId,
  serviceType,
  locale,
  termsConsent,
  earlyStartRequested,
  purchaseSnapshot = null,
}) {
  if (typeof userId !== "string" || !userId.trim() ||
      !["pro", "credit_topup"].includes(serviceType) ||
      !["en", "de", "fr"].includes(locale) ||
      termsConsent?.accepted !== true || termsConsent.locale !== locale ||
      typeof earlyStartRequested !== "boolean" || !termsConsent.precontractDisclosure) {
    throw failure(400, "CONTRACT_CONFIRMATION_INPUT_INVALID");
  }
  const snapshot = contractTermsSnapshot(
    locale,
    serviceType,
    earlyStartRequested,
    termsConsent.version,
    termsConsent.precontractDisclosure,
  );
  const row = {
    id: randomUUID(),
    clerk_user_id: userId,
    service_type: serviceType,
    state: "checkout_pending",
    terms_locale: locale,
    terms_version: termsConsent.version,
    terms_accepted_at: termsConsent.acceptedAt,
    confirmation_version: CONTRACT_CONFIRMATION_VERSION,
    terms_snapshot: snapshot,
    ...(purchaseSnapshot ? { purchase_snapshot: purchaseSnapshot } : {}),
    early_start_requested: earlyStartRequested,
    early_start_requested_at: earlyStartRequested ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE).insert(row);
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_STORE_UNAVAILABLE");
  return { id: row.id, earlyStartRequested, earlyStartRequestedAt: row.early_start_requested_at };
}

export async function attachContractConfirmationSession(supabase, {
  confirmationId,
  userId,
  sessionId,
}) {
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .is("stripe_checkout_session_id", null)
    .select("id")
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_SESSION_ATTACH_FAILED");
  if (data?.id === confirmationId) return true;

  const { data: existing, error: lookupError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("stripe_checkout_session_id")
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (lookupError || existing?.stripe_checkout_session_id !== sessionId) {
    throw failure(503, "CONTRACT_CONFIRMATION_SESSION_ATTACH_FAILED");
  }
  return true;
}

export async function markContractConfirmationCheckoutFailed(supabase, confirmationId, userId) {
  const { error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update({ state: "payment_failed" })
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .eq("state", "checkout_pending");
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_STATE_UPDATE_FAILED");
}

export async function markContractConfirmationExpired(supabase, confirmationId, userId, sessionId) {
  const query = supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update({ state: "checkout_expired" })
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .eq("state", "checkout_pending");
  if (sessionId) query.eq("stripe_checkout_session_id", sessionId);
  const { error } = await query;
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_STATE_UPDATE_FAILED");
}

export async function markContractConfirmationRefundReview(supabase, {
  confirmationId,
  userId,
  eventId,
}) {
  if (typeof confirmationId !== "string" || !confirmationId ||
      typeof userId !== "string" || !userId || typeof eventId !== "string" || !eventId) {
    return { status: "ignored" };
  }
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update({
      state: "refund_review",
      refund_review_event_id: eventId,
      refund_review_started_at: new Date().toISOString(),
    })
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .in("payment_status", ["pending", "paid"])
    .select("id")
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_REFUND_REVIEW_FAILED");
  return { status: data ? "refund_review" : "ignored" };
}

function stripeObjectId(value) {
  if (typeof value === "string" && value) return value;
  return typeof value?.id === "string" && value.id ? value.id : null;
}

function transactionSnapshotFor(session, { serviceType, marketData, paymentIntentId, subscriptionId, invoiceId, paidAt }) {
  const customer = session.customer_details || {};
  const address = customer.address || {};
  const locale = ["en", "de", "fr"].includes(session.metadata?.premivateTermsLocale)
    ? session.metadata.premivateTermsLocale
    : "en";
  const isGerman = locale === "de";
  const isFrench = locale === "fr";
  const packageCredits = Number(session.metadata?.credits);
  const productLabel = serviceType === "pro"
    ? (isGerman ? "PREMIVATE Pro · bezahlter Monatsdienst" : isFrench ? "PREMIVATE Pro · service mensuel payant" : "PREMIVATE Pro · paid monthly service")
    : `PREMIVATE Top-up · ${Number.isSafeInteger(packageCredits) ? packageCredits : ""} ${isGerman ? "Credits" : isFrench ? "crédits" : "credits"}`;
  return {
    serviceType,
    productLabel,
    credits: serviceType === "credit_topup" ? Number(session.metadata?.credits) : null,
    checkoutSessionId: session.id,
    customerId: stripeObjectId(session.customer),
    customerName: typeof customer.name === "string" ? customer.name : "",
    customerEmail: typeof customer.email === "string" ? customer.email : "",
    billingAddress: {
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postal_code || "",
      country: marketData.billingCountry,
    },
    buyerType: marketData.buyerType,
    taxIdProvided: marketData.taxIdProvided,
    amountTotal: session.amount_total,
    currency: typeof session.currency === "string" ? session.currency.toUpperCase() : "",
    paymentIntentId: paymentIntentId || null,
    subscriptionId: subscriptionId || null,
    invoiceId: invoiceId || null,
    termsVersion: session.metadata?.premivateTermsVersion || "",
    termsLocale: session.metadata?.premivateTermsLocale || "",
    termsAcceptedAt: session.metadata?.premivateTermsAcceptedAt || "",
    earlyStartRequested: session.metadata?.premivateEarlyStartRequested === "true",
    earlyStartRequestedAt: session.metadata?.premivateEarlyStartRequestedAt || "",
    earlyStartRequestVersion: session.metadata?.premivateEarlyStartVersion || CONTRACT_CONFIRMATION_VERSION,
    precontractMarketScope: session.metadata?.premivatePrecontractMarketScope || "",
    precontractRegion: session.metadata?.premivatePrecontractRegion || "",
    buyerTypeSelection: session.metadata?.premivateBuyerType || "",
    eligibilityVersion: session.metadata?.premivateEligibilityVersion || "",
    eligibilityStatus: session.metadata?.premivateEligibilityStatus || "",
    eligibilityBillingCountry: session.metadata?.premivateEligibilityBillingCountry || "",
    eligibilityIpCountry: session.metadata?.premivateEligibilityIpCountry || "",
    eligibilityEvidence: session.metadata?.premivateEligibilityEvidence || "",
    eligibilityCheckedAt: session.metadata?.premivateEligibilityCheckedAt || "",
    frenchTermsPresented: session.metadata?.premivateFrenchTermsPresented === "true",
    alternativeLanguageChoice: session.metadata?.premivateAlternativeLanguageChoice === "true",
    contractedAt: paidAt.toISOString(),
    checkoutCreatedAt: Number.isSafeInteger(session.created)
      ? new Date(session.created * 1000).toISOString()
      : new Date().toISOString(),
    liveMode: session.livemode === true,
  };
}

export async function recordPaidContractConfirmation(supabase, {
  session,
  userId,
  expectedServiceType,
  paidAt,
  paymentIntentId = null,
  subscriptionId = null,
  invoiceId = null,
  refundReview = false,
}) {
  const metadata = session?.metadata || {};
  const confirmationId = metadata.premivateContractConfirmationId;
  if (typeof confirmationId !== "string" || !confirmationId ||
      metadata.clerkUserId !== userId || metadata.premivateEarlyStartVersion !== CONTRACT_CONFIRMATION_VERSION ||
      metadata.premivateEarlyStartRequested !== "true" && metadata.premivateEarlyStartRequested !== "false" ||
      session.client_reference_id !== userId) {
    throw failure(400, "CONTRACT_CONFIRMATION_METADATA_INVALID");
  }
  const { data: current, error: readError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("*")
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (readError || !current) throw failure(503, "CONTRACT_CONFIRMATION_RECORD_MISSING");
  const precontractSnapshot = current.terms_snapshot?.precontractDisclosure || null;
  const requestedAt = metadata.premivateEarlyStartRequested === "true"
    ? metadata.premivateEarlyStartRequestedAt
    : null;
  if (current.service_type !== expectedServiceType ||
      current.early_start_requested !== (metadata.premivateEarlyStartRequested === "true") ||
      (requestedAt === null
        ? current.early_start_requested_at !== null
        : !sameInstant(current.early_start_requested_at, requestedAt)) ||
      current.terms_version !== metadata.premivateTermsVersion ||
      current.terms_locale !== metadata.premivateTermsLocale ||
      (precontractSnapshot
        ? precontractSnapshot.marketCountryScope !== metadata.premivatePrecontractMarketScope ||
          precontractSnapshot.marketRegion !== metadata.premivatePrecontractRegion ||
          precontractSnapshot.buyerType !== metadata.premivateBuyerType ||
          String(precontractSnapshot.frenchVersionPresented) !== metadata.premivateFrenchTermsPresented ||
          String(precontractSnapshot.alternativeLanguageChoice) !== metadata.premivateAlternativeLanguageChoice
        : [metadata.premivatePrecontractMarketScope, metadata.premivatePrecontractRegion,
            metadata.premivateFrenchTermsPresented, metadata.premivateAlternativeLanguageChoice]
          .some((value) => value !== undefined)) ||
      !sameInstant(current.terms_accepted_at, metadata.premivateTermsAcceptedAt) ||
      current.stripe_checkout_session_id && current.stripe_checkout_session_id !== session.id) {
    throw failure(400, "CONTRACT_CONFIRMATION_SESSION_MISMATCH");
  }
  const marketData = getCheckoutMarketData(session);
  if (!marketData) throw failure(503, "CONTRACT_CONFIRMATION_MARKET_DATA_MISSING");
  const paidInstant = Number.isFinite(Date.parse(paidAt)) ? new Date(paidAt) : new Date();
  const earlyStartRequested = current.early_start_requested;
  const euConsumer = isEUConsumer(marketData.billingCountry, marketData);
  // Checkout stores a billing address, not a reliable local time zone. A 15-day
  // UTC guard clears the full 14-calendar-day period across date-line boundaries.
  const serviceStartAt = euConsumer && !earlyStartRequested
    ? addDays(paidInstant, 15)
    : paidInstant.toISOString();
  const snapshot = transactionSnapshotFor(session, {
    serviceType: expectedServiceType,
    marketData,
    paymentIntentId,
    subscriptionId,
    invoiceId,
    paidAt: paidInstant,
  });
  if (current.transaction_snapshot && (
      current.transaction_snapshot.checkoutSessionId !== snapshot.checkoutSessionId ||
      current.transaction_snapshot.amountTotal !== snapshot.amountTotal ||
      current.transaction_snapshot.currency !== snapshot.currency ||
      (current.transaction_snapshot.paymentIntentId && paymentIntentId &&
        current.transaction_snapshot.paymentIntentId !== paymentIntentId) ||
      (current.transaction_snapshot.subscriptionId && subscriptionId &&
        current.transaction_snapshot.subscriptionId !== subscriptionId)
  )) {
    throw failure(409, "CONTRACT_CONFIRMATION_TRANSACTION_MISMATCH");
  }
  const serviceStartPassed = Date.parse(serviceStartAt) <= Date.now();
  const nextState = !current.pdf_transfer_completed_at
    ? "paid_pending_transfer"
    : expectedServiceType === "credit_topup"
      ? (current.state === "service_eligible" ? "service_eligible" : "transfer_reported")
      : (serviceStartPassed ? "service_eligible" : "transfer_reported");
  const update = {
    stripe_checkout_session_id: session.id,
    stripe_customer_id: snapshot.customerId,
    stripe_subscription_id: subscriptionId,
    stripe_payment_intent_id: paymentIntentId,
    stripe_invoice_id: invoiceId,
    livemode: session.livemode === true,
    amount_total: session.amount_total,
    currency: typeof session.currency === "string" ? session.currency.toLowerCase() : null,
    market_country: marketData.billingCountry,
    buyer_type: marketData.buyerType,
    transaction_snapshot: current.transaction_snapshot || snapshot,
    payment_status: "paid",
    paid_at: current.paid_at || paidInstant.toISOString(),
    service_start_at: current.service_start_at || serviceStartAt,
  };
  const normalUpdate = {
    ...update,
    state: refundReview
      ? "refund_review"
      : current.state === "service_eligible" ? "service_eligible" : nextState,
    ...(!refundReview && expectedServiceType === "pro" && nextState === "service_eligible"
      ? { entitlement_unlocked_at: current.entitlement_unlocked_at || new Date().toISOString() }
      : {}),
  };
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update(normalUpdate)
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .neq("state", "refund_review")
    .select("*")
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_PAYMENT_RECORD_FAILED");
  if (data) return data;

  const currentState = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("state")
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (currentState.error || currentState.data?.state !== "refund_review") {
    throw failure(503, "CONTRACT_CONFIRMATION_PAYMENT_RECORD_FAILED");
  }
  const { data: reviewData, error: reviewError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update(update)
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .eq("state", "refund_review")
    .select("*")
    .maybeSingle();
  if (reviewError || !reviewData) throw failure(503, "CONTRACT_CONFIRMATION_PAYMENT_RECORD_FAILED");
  return reviewData;
}

export async function recordPaidServerFinalizedContractConfirmation(supabase, {
  paymentIntent,
  customer,
  marketData,
  userId,
  expectedServiceType,
  paidAt,
  subscriptionId = null,
  invoiceId = null,
  refundReview = false,
}) {
  const metadata = paymentIntent?.metadata || {};
  const confirmationId = metadata.premivateContractConfirmationId;
  const customerId = stripeObjectId(paymentIntent?.customer);
  if (typeof confirmationId !== "string" || !confirmationId ||
      metadata.clerkUserId !== userId ||
      metadata.premivateCheckoutFlow !== "r2-server-finalized-v1" ||
      metadata.premivateEarlyStartVersion !== CONTRACT_CONFIRMATION_VERSION ||
      !["true", "false"].includes(metadata.premivateEarlyStartRequested) ||
      !customerId || customerId !== stripeObjectId(customer?.id) ||
      !marketData?.billingCountry || !marketData?.buyerType) {
    throw failure(400, "SERVER_FINALIZED_CONFIRMATION_METADATA_INVALID");
  }
  const { data: current, error: readError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("*").eq("id", confirmationId).eq("clerk_user_id", userId).maybeSingle();
  if (readError || !current) throw failure(503, "CONTRACT_CONFIRMATION_RECORD_MISSING");
  const precontract = current.terms_snapshot?.precontractDisclosure;
  const eligibility = current.eligibility_snapshot;
  if (current.service_type !== expectedServiceType ||
      current.purchase_snapshot?.serviceType !== expectedServiceType ||
      current.stripe_confirmation_token_id == null ||
      current.stripe_customer_id !== customerId ||
      current.early_start_requested !== (metadata.premivateEarlyStartRequested === "true") ||
      current.terms_version !== metadata.premivateTermsVersion ||
      current.terms_locale !== metadata.premivateTermsLocale ||
      !sameInstant(current.terms_accepted_at, metadata.premivateTermsAcceptedAt) ||
      precontract?.marketCountryScope !== metadata.premivatePrecontractMarketScope ||
      precontract?.buyerType !== metadata.premivateBuyerType ||
      !eligibility ||
      eligibility.premivateEligibilityBillingCountry !== metadata.premivateEligibilityBillingCountry ||
      eligibility.premivateEligibilityIpCountry !== metadata.premivateEligibilityIpCountry ||
      eligibility.premivateEligibilityVersion !== "r2-server-finalized-v1" ||
      eligibility.premivateEligibilityStatus !== "approved" ||
      marketData.billingCountry !== metadata.premivateEligibilityBillingCountry ||
      marketData.buyerType !== metadata.premivateBuyerType ||
      paymentIntent.status !== "succeeded" || paymentIntent.amount_received !== paymentIntent.amount ||
      paymentIntent.livemode !== (process.env.VERCEL_ENV === "production")) {
    throw failure(400, "SERVER_FINALIZED_CONFIRMATION_MISMATCH");
  }
  if (expectedServiceType === "credit_topup" && (
      metadata.premivateCheckoutType !== "credit_topup" ||
      metadata.creditPackage !== current.purchase_snapshot?.packageId ||
      metadata.credits !== String(current.purchase_snapshot?.credits) ||
      paymentIntent.amount !== current.purchase_snapshot?.amount || paymentIntent.currency !== "chf")) {
    throw failure(400, "SERVER_FINALIZED_TOPUP_MISMATCH");
  }
  if (expectedServiceType === "pro" && (
      paymentIntent.amount !== current.purchase_snapshot?.amount || paymentIntent.currency !== "chf")) {
    throw failure(400, "SERVER_FINALIZED_PRO_MISMATCH");
  }
  const address = customer.address || {};
  const paidInstant = Number.isFinite(Date.parse(paidAt)) ? new Date(paidAt) : new Date();
  const euConsumer = isEUConsumer(marketData.billingCountry, marketData);
  const serviceStartAt = euConsumer && marketData.buyerType === "consumer" && !current.early_start_requested
    ? addDays(paidInstant, 15)
    : paidInstant.toISOString();
  const isGerman = current.terms_locale === "de";
  const isFrench = current.terms_locale === "fr";
  const credits = expectedServiceType === "credit_topup" ? Number(current.purchase_snapshot.credits) : null;
  const productLabel = expectedServiceType === "pro"
    ? (isGerman ? "PREMIVATE Pro · bezahlter Monatsdienst" : isFrench ? "PREMIVATE Pro · service mensuel payant" : "PREMIVATE Pro · paid monthly service")
    : `PREMIVATE Top-up · ${credits} ${isGerman ? "Credits" : isFrench ? "crédits" : "credits"}`;
  const snapshot = {
    serviceType: expectedServiceType,
    productLabel,
    credits,
    checkoutSessionId: null,
    paymentIntentId: paymentIntent.id,
    subscriptionId,
    invoiceId,
    customerId,
    customerName: typeof customer.name === "string" ? customer.name : "",
    customerEmail: typeof customer.email === "string" ? customer.email : "",
    billingAddress: {
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postal_code || "",
      country: marketData.billingCountry,
    },
    buyerType: marketData.buyerType,
    taxIdProvided: Array.isArray(customer.tax_ids?.data) && customer.tax_ids.data.length > 0,
    amountTotal: paymentIntent.amount,
    currency: paymentIntent.currency,
    termsVersion: metadata.premivateTermsVersion,
    termsLocale: metadata.premivateTermsLocale,
    termsAcceptedAt: metadata.premivateTermsAcceptedAt,
    earlyStartRequested: current.early_start_requested,
    earlyStartRequestedAt: current.early_start_requested_at || "",
    earlyStartRequestVersion: CONTRACT_CONFIRMATION_VERSION,
    precontractMarketScope: metadata.premivatePrecontractMarketScope,
    precontractRegion: metadata.premivatePrecontractRegion || "",
    buyerTypeSelection: metadata.premivateBuyerType,
    eligibilityVersion: metadata.premivateEligibilityVersion,
    eligibilityStatus: metadata.premivateEligibilityStatus,
    eligibilityBillingCountry: metadata.premivateEligibilityBillingCountry,
    eligibilityIpCountry: metadata.premivateEligibilityIpCountry,
    eligibilityEvidence: metadata.premivateEligibilityEvidence,
    eligibilityCheckedAt: metadata.premivateEligibilityCheckedAt,
    frenchTermsPresented: metadata.premivateFrenchTermsPresented === "true",
    alternativeLanguageChoice: metadata.premivateAlternativeLanguageChoice === "true",
    contractedAt: paidInstant.toISOString(),
    liveMode: paymentIntent.livemode === true,
  };
  if (current.transaction_snapshot && (
      current.transaction_snapshot.paymentIntentId !== paymentIntent.id ||
      current.transaction_snapshot.amountTotal !== snapshot.amountTotal ||
      current.transaction_snapshot.currency !== snapshot.currency)) {
    throw failure(409, "CONTRACT_CONFIRMATION_TRANSACTION_MISMATCH");
  }
  const serviceStartPassed = Date.parse(serviceStartAt) <= Date.now();
  const nextState = !current.pdf_transfer_completed_at
    ? "paid_pending_transfer"
    : expectedServiceType === "credit_topup"
      ? (current.state === "service_eligible" ? "service_eligible" : "transfer_reported")
      : (serviceStartPassed ? "service_eligible" : "transfer_reported");
  const update = {
    stripe_customer_id: customerId,
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    stripe_payment_intent_id: paymentIntent.id,
    ...(invoiceId ? { stripe_invoice_id: invoiceId } : {}),
    livemode: paymentIntent.livemode === true,
    amount_total: paymentIntent.amount,
    currency: paymentIntent.currency,
    market_country: marketData.billingCountry,
    buyer_type: marketData.buyerType,
    transaction_snapshot: current.transaction_snapshot || snapshot,
    payment_status: "paid",
    paid_at: current.paid_at || paidInstant.toISOString(),
    service_start_at: current.service_start_at || serviceStartAt,
  };
  const normalUpdate = {
    ...update,
    state: refundReview ? "refund_review" : current.state === "service_eligible" ? "service_eligible" : nextState,
    ...(!refundReview && expectedServiceType === "pro" && nextState === "service_eligible"
      ? { entitlement_unlocked_at: current.entitlement_unlocked_at || new Date().toISOString() }
      : {}),
  };
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update(normalUpdate)
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .neq("state", "refund_review")
    .select("*")
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_PAYMENT_RECORD_FAILED");
  if (data) return data;
  const { data: reviewData, error: reviewError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update(update)
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .eq("state", "refund_review")
    .select("*")
    .maybeSingle();
  if (reviewError || !reviewData) throw failure(503, "CONTRACT_CONFIRMATION_PAYMENT_RECORD_FAILED");
  return reviewData;
}

export async function linkContractConfirmationSubscription(supabase, {
  confirmationId,
  userId,
  subscriptionId,
  invoiceId = null,
}) {
  if (!confirmationId) return null;
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update({
      stripe_subscription_id: subscriptionId,
      ...(invoiceId ? { stripe_invoice_id: invoiceId } : {}),
    })
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) throw failure(503, "CONTRACT_CONFIRMATION_SUBSCRIPTION_LINK_FAILED");
  return data;
}

export async function getContractConfirmationForUser(supabase, userId, sessionId) {
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("id,clerk_user_id,service_type,state,stripe_checkout_session_id,terms_locale,terms_version,early_start_requested,market_country,buyer_type,payment_status,paid_at,service_start_at,pdf_sha256,pdf_byte_length,pdf_transfer_completed_at,entitlement_unlocked_at,created_at")
    .eq("clerk_user_id", userId)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_LOOKUP_FAILED");
  return data || null;
}

export async function getContractConfirmationByIdForUser(supabase, userId, confirmationId) {
  if (typeof confirmationId !== "string" || !confirmationId) return null;
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("id,clerk_user_id,service_type,state,stripe_checkout_session_id,terms_locale,terms_version,early_start_requested,market_country,buyer_type,payment_status,paid_at,service_start_at,pdf_sha256,pdf_byte_length,pdf_transfer_completed_at,entitlement_unlocked_at,created_at,stripe_payment_intent_id")
    .eq("clerk_user_id", userId)
    .eq("id", confirmationId)
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_LOOKUP_FAILED");
  return data || null;
}

export async function listContractConfirmationsForUser(supabase, userId) {
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("id,clerk_user_id,service_type,state,stripe_checkout_session_id,terms_locale,terms_version,early_start_requested,market_country,buyer_type,payment_status,paid_at,service_start_at,pdf_sha256,pdf_byte_length,pdf_transfer_completed_at,entitlement_unlocked_at,created_at,stripe_payment_intent_id")
    .eq("clerk_user_id", userId)
    .in("payment_status", ["pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_LOOKUP_FAILED");
  return data || [];
}

export async function readContractConfirmation(supabase, confirmationId, userId) {
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("*")
    .eq("id", confirmationId)
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_LOOKUP_FAILED");
  if (!data) throw failure(404, "CONTRACT_CONFIRMATION_NOT_FOUND");
  return data;
}

function renderConfirmationPdf(row) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const left = 48;
  const maxWidth = width - left * 2;
  const isGerman = row.terms_locale === "de";
  const isFrench = row.terms_locale === "fr";
  const localize = (english, german, french) => isGerman ? german : isFrench ? french : english;
  let y = 54;

  function write(text, { size = 10, bold = false, gap = 8 } = {}) {
    const value = String(text || "").trim();
    if (!value) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, maxWidth);
    const lineHeight = size * 1.45;
    if (y + lines.length * lineHeight > height - 48) {
      doc.addPage();
      y = 54;
    }
    doc.text(lines, left, y);
    y += lines.length * lineHeight + gap;
  }

  const transaction = row.transaction_snapshot || {};
  const address = transaction.billingAddress || {};
  const customerLines = [
    transaction.customerName,
    transaction.customerEmail,
    address.line1,
    address.line2,
    [address.postalCode, address.city, address.state].filter(Boolean).join(" "),
    address.country,
  ].filter(Boolean);

  write(localize("PREMIVATE — Contract confirmation", "PREMIVATE — Vertragsbestätigung", "PREMIVATE — Confirmation du contrat"), { size: 18, bold: true, gap: 14 });
  write(`${localize("Customer", "Kunde", "Client")}: ${customerLines.join(" · ")}`, { size: 10 });
  write(`${localize("Contract", "Vertrag", "Contrat")}: ${transaction.productLabel || row.service_type}`, { size: 11, bold: true });
  write(`${localize("Payment reference", "Zahlungsreferenz", "Référence de paiement")}: ${transaction.checkoutSessionId || row.stripe_checkout_session_id || transaction.paymentIntentId || row.stripe_payment_intent_id || "—"}`);
  write(`${localize("Contract date", "Vertragsdatum", "Date du contrat")}: ${transaction.contractedAt || row.paid_at || ""}`);
  write(`${localize("Total price", "Gesamtpreis", "Prix total")}: ${((Number(transaction.amountTotal) || Number(row.amount_total) || 0) / 100).toFixed(2)} ${(transaction.currency || row.currency || "").toUpperCase()}`);
  write(`${localize("Contract language and Terms version", "Vertragssprache und AGB-Version", "Langue du contrat et version des Conditions")}: ${(transaction.termsLocale || row.terms_locale || "").toUpperCase()} · ${transaction.termsVersion || row.terms_version || ""}`);
  write(`${localize("Billing country and purchase type", "Rechnungsland und Nutzungsart", "Pays de facturation et type d’achat")}: ${(transaction.billingAddress?.country || row.market_country || "").toUpperCase()} · ${transaction.buyerType || row.buyer_type || ""}`);
  const precontract = row.terms_snapshot?.precontractDisclosure;
  if (precontract) {
    const declaredRegion = [precontract.marketCountryScope, precontract.marketRegion].filter(Boolean).join(" · ");
    write(`${localize("Pre-contract billing-region declaration", "Vorvertragliche Rechnungsregion-Angabe", "Déclaration précontractuelle de région de facturation")}: ${declaredRegion}`);
    const disclosure = precontract.copy || {};
    const description = row.service_type === "pro" ? disclosure.proDescription : disclosure.topupDescription;
    const payment = row.service_type === "pro" ? disclosure.proPayment : disclosure.topupPayment;
    write(`${localize("Offer information", "Angebotsinformation", "Information sur l’offre")}: ${description}`);
    write(`${localize("Payment and renewal", "Zahlung und Verlängerung", "Paiement et renouvellement")}: ${payment}`);
    write(`${localize("Performance", "Leistung", "Prestation")}: ${disclosure.performance}`);
    write(`${localize("Cancellation and withdrawal", "Kündigung und Widerruf", "Résiliation et rétractation")}: ${disclosure.cancellation}`);
  }
  write(`${localize("Early-start request", "Antrag auf vorzeitigen Leistungsbeginn", "Demande de commencement anticipé")}: ${row.early_start_requested ? localize("expressly requested", "ausdrücklich gestellt", "expressément demandée") : localize("not requested", "nicht gestellt", "non demandée")}`);
  write(`${localize("Request timestamp", "Zeitpunkt des Antrags", "Date de la demande")}: ${row.early_start_requested ? row.early_start_requested_at : localize("not applicable", "nicht anwendbar", "sans objet")}`);
  write(`${localize("Service start", "Leistungsbeginn", "Début de la prestation")}: ${row.service_start_at || localize("after transfer confirmation", "nach Übertragung der Bestätigung", "après transfert de la confirmation")}`);
  write(`${localize("Seller", "Anbieter", "Vendeur")}: Franco Baumann · Rosenbüelstrasse 21 · 9642 Ebnat-Kappel SG · ${localize("Switzerland", "Schweiz", "Suisse")} · support@premivate.com`, { gap: 14 });
  if (row.terms_snapshot?.title) write(row.terms_snapshot.title, { size: 15, bold: true, gap: 12 });

  const sections = Array.isArray(row.terms_snapshot?.sections) ? row.terms_snapshot.sections : [];
  for (const section of sections) {
    write(section.heading, { size: 12, bold: true, gap: 5 });
    for (const paragraph of section.paragraphs || []) write(paragraph, { size: 9, gap: 6 });
  }
  if (row.early_start_requested) {
    const requestText = row.terms_snapshot?.earlyStartRequestByService?.[row.service_type] ||
      row.terms_snapshot?.earlyStartRequest;
    write(localize("Your separate request for early performance", "Dein gesonderter Antrag auf vorzeitigen Leistungsbeginn", "Votre demande distincte de commencement anticipé"), { size: 12, bold: true });
    write(requestText, { size: 9 });
    write(`${localize("Request timestamp", "Zeitpunkt des Antrags", "Date de la demande")}: ${row.early_start_requested_at}`, { size: 9 });
  }
  write(localize(
    "This PDF is the immutable contract/withdrawal copy for this Checkout transaction.",
    "Dieses PDF ist die unveränderliche Vertrags- und Widerrufsbestätigung zu diesem Checkout.",
    "Ce PDF constitue la copie contractuelle et de rétractation inaltérable de cette transaction Checkout.",
  ), { size: 9, gap: 0 });
  return Buffer.from(doc.output("arraybuffer"));
}

export async function createOrReadConfirmationPdf(supabase, confirmationId, userId) {
  let row = await readContractConfirmation(supabase, confirmationId, userId);
  const needsCustomerName = Boolean(row.terms_snapshot?.precontractDisclosure);
  if (row.payment_status !== "paid" || !row.paid_at || !row.transaction_snapshot || !row.market_country || !row.buyer_type ||
      (needsCustomerName && (typeof row.transaction_snapshot.customerName !== "string" || !row.transaction_snapshot.customerName.trim()))) {
    throw failure(409, "CONTRACT_CONFIRMATION_NOT_PAID_OR_INCOMPLETE");
  }
  if (!row.pdf_data_base64) {
    const bytes = renderConfirmationPdf(row);
    const pdfBase64 = bytes.toString("base64");
    const pdfSha256 = createHash("sha256").update(bytes).digest("hex");
    const pdfCreatedAt = new Date().toISOString();
    const { error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
      .update({ pdf_data_base64: pdfBase64, pdf_sha256: pdfSha256, pdf_byte_length: bytes.length, pdf_created_at: pdfCreatedAt })
      .eq("id", confirmationId)
      .eq("clerk_user_id", userId)
      .is("pdf_data_base64", null);
    if (error) {
      row = await readContractConfirmation(supabase, confirmationId, userId);
      if (!row.pdf_data_base64) throw failure(503, "CONTRACT_CONFIRMATION_PDF_STORE_FAILED");
    } else {
      row = await readContractConfirmation(supabase, confirmationId, userId);
    }
  }
  const bytes = Buffer.from(row.pdf_data_base64, "base64");
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== row.pdf_sha256 || bytes.length !== row.pdf_byte_length) {
    throw failure(503, "CONTRACT_CONFIRMATION_PDF_INTEGRITY_FAILED");
  }
  return { row, bytes };
}

async function grantTopupIfEligible(supabase, row) {
  if (row.service_type !== "credit_topup" || row.payment_status !== "paid" || row.state === "refund_review" ||
      !row.pdf_transfer_completed_at || !row.service_start_at || Date.parse(row.service_start_at) > Date.now()) {
    return { status: "pending" };
  }
  if (!row.stripe_payment_intent_id || !row.transaction_snapshot) {
    throw failure(503, "CONTRACT_CONFIRMATION_TOPUP_FACTS_MISSING");
  }
  const credits = Number(row.transaction_snapshot.credits);
  if (!Number.isSafeInteger(credits) || credits <= 0) {
    throw failure(503, "CONTRACT_CONFIRMATION_TOPUP_CREDITS_INVALID");
  }
  const grant = await grantPurchasedCredits(supabase, {
    userId: row.clerk_user_id,
    paymentIntentId: row.stripe_payment_intent_id,
    credits,
  });
  if (!grant || !["granted", "duplicate"].includes(grant.status)) {
    throw failure(503, "CONTRACT_CONFIRMATION_TOPUP_GRANT_FAILED");
  }
  const { error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .update({ state: "service_eligible", entitlement_unlocked_at: row.entitlement_unlocked_at || new Date().toISOString() })
    .eq("id", row.id)
    .eq("clerk_user_id", row.clerk_user_id)
    .eq("payment_status", "paid");
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_TOPUP_STATE_FAILED");
  return { status: grant.status };
}

export async function recordPdfTransfer(supabase, {
  confirmationId,
  userId,
  sha256,
  byteLength,
}) {
  const row = await readContractConfirmation(supabase, confirmationId, userId);
  if (row.payment_status !== "paid" || !row.pdf_sha256 ||
      row.pdf_sha256 !== sha256 || row.pdf_byte_length !== byteLength) {
    throw failure(409, "CONTRACT_CONFIRMATION_TRANSFER_MISMATCH");
  }
  const now = new Date().toISOString();
  const serviceEligible = Number.isFinite(Date.parse(row.service_start_at || "")) &&
    Date.parse(row.service_start_at) <= Date.now();
  const state = serviceEligible && row.service_type === "pro" ? "service_eligible" : "transfer_reported";
  if (!row.pdf_transfer_completed_at) {
    const transferFields = {
      pdf_transfer_completed_at: now,
      pdf_transfer_reported_sha256: sha256,
      pdf_transfer_reported_byte_length: byteLength,
    };
    const { data: recorded, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
      .update({
        ...transferFields,
        state: row.service_type === "credit_topup"
          ? "transfer_reported"
          : (row.state === "service_eligible" ? "service_eligible" : state),
        ...(serviceEligible && row.service_type === "pro"
          ? { entitlement_unlocked_at: row.entitlement_unlocked_at || now }
          : {}),
      })
      .eq("id", confirmationId)
      .eq("clerk_user_id", userId)
      .neq("state", "refund_review")
      .is("pdf_transfer_completed_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw failure(503, "CONTRACT_CONFIRMATION_TRANSFER_RECORD_FAILED");
    if (!recorded) {
      const latest = await readContractConfirmation(supabase, confirmationId, userId);
      if (latest.state === "refund_review" && !latest.pdf_transfer_completed_at) {
        const { error: reviewError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
          .update(transferFields)
          .eq("id", confirmationId)
          .eq("clerk_user_id", userId)
          .eq("state", "refund_review")
          .is("pdf_transfer_completed_at", null);
        if (reviewError) throw failure(503, "CONTRACT_CONFIRMATION_TRANSFER_RECORD_FAILED");
      }
    }
  }
  const updated = await readContractConfirmation(supabase, confirmationId, userId);
  const topup = await grantTopupIfEligible(supabase, updated);
  const finalRow = topup.status === "granted" || topup.status === "duplicate"
    ? await readContractConfirmation(supabase, confirmationId, userId)
    : updated;
  return {
    status: finalRow.state === "refund_review"
      ? "refund_review"
      : (topup.status === "pending" && !serviceEligible
        ? "transfer_reported_waiting_for_service_start"
        : "service_eligible"),
    serviceStartAt: finalRow.service_start_at,
    earlyStartRequested: finalRow.early_start_requested,
    state: finalRow.state,
  };
}

export async function finalizeDueTopupConfirmation(supabase, row) {
  if (row.service_type !== "credit_topup" || !row.pdf_transfer_completed_at ||
      Date.parse(row.service_start_at || "") > Date.now()) return { status: "pending" };
  return grantTopupIfEligible(supabase, row);
}

export async function finalizeDueTopupConfirmationsForUser(supabase, userId) {
  if (typeof userId !== "string" || !userId.trim()) return { finalized: 0 };
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("id,clerk_user_id,service_type,state,payment_status,pdf_transfer_completed_at,service_start_at,stripe_payment_intent_id,transaction_snapshot,entitlement_unlocked_at")
    .eq("clerk_user_id", userId)
    .eq("service_type", "credit_topup")
    .eq("payment_status", "paid")
    .eq("state", "transfer_reported")
    .not("pdf_transfer_completed_at", "is", null)
    .lte("service_start_at", new Date().toISOString())
    .limit(20);
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_TOPUP_LOOKUP_FAILED");
  let finalized = 0;
  for (const row of data || []) {
    const result = await finalizeDueTopupConfirmation(supabase, row);
    if (result.status === "granted" || result.status === "duplicate") finalized += 1;
  }
  return { finalized };
}

export async function isContractConfirmationServiceEligible(supabase, confirmationId) {
  if (!confirmationId) return null;
  let row;
  const { data, error } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
    .select("id,service_type,clerk_user_id,payment_status,pdf_transfer_completed_at,service_start_at,state,entitlement_unlocked_at")
    .eq("id", confirmationId)
    .maybeSingle();
  if (error) throw failure(503, "CONTRACT_CONFIRMATION_ENTITLEMENT_LOOKUP_FAILED");
  row = data;
  if (!row) throw failure(503, "CONTRACT_CONFIRMATION_RECORD_MISSING");
  const eligible = row.service_type === "pro" && row.payment_status === "paid" && row.state !== "refund_review" && Boolean(row.pdf_transfer_completed_at) &&
    Number.isFinite(Date.parse(row.service_start_at || "")) && Date.parse(row.service_start_at) <= Date.now();
  if (eligible && row.state !== "service_eligible") {
    const { data: unlocked, error: updateError } = await supabase.from(CONTRACT_CONFIRMATION_TABLE)
      .update({ state: "service_eligible", entitlement_unlocked_at: row.entitlement_unlocked_at || new Date().toISOString() })
      .eq("id", confirmationId)
      .neq("state", "refund_review")
      .select("id")
      .maybeSingle();
    if (updateError) throw failure(503, "CONTRACT_CONFIRMATION_ENTITLEMENT_UPDATE_FAILED");
    if (!unlocked) return false;
  }
  return eligible;
}
