export const RELEASE_1_PREPAYMENT_MARKETS = Object.freeze(["CH", "SG", "AU", "NZ"]);
// Keep this allowlist empty until both paid flows can prevent capture before
// server-side eligibility succeeds. Stripe Elements client secrets currently
// exist before that check, and the subscription flow has no verified
// server-controlled capture gate. Environment configuration must not reopen
// checkout while this implementation gap remains.
export const PREPAYMENT_MARKET_ALLOWLIST = Object.freeze([]);

const RELEASE_1_MARKET_SET = new Set(RELEASE_1_PREPAYMENT_MARKETS);
const BUYER_TYPES = new Set([
  "consumer",
  "business_registered",
  "business_unregistered",
  "business_unknown",
]);
const BUYER_TYPE_BY_STRIPE_VALUE = new Map([
  ["consumer", "consumer"],
  ["businessregistered", "business_registered"],
  ["businessunregistered", "business_unregistered"],
  ["businessunknown", "business_unknown"],
]);
const ELIGIBILITY_VERSION = "r1-location-v1";
const CHECK_TTL_MS = 10 * 60 * 1000;

function countryCode(value) {
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value)
    ? value.toUpperCase()
    : null;
}

export function normalizeBuyerType(value) {
  if (BUYER_TYPES.has(value)) return value;
  return BUYER_TYPE_BY_STRIPE_VALUE.get(value) || null;
}

export function isPrepaymentMarketActivated(country) {
  const market = countryCode(country);
  return Boolean(market && market !== "NZ" && PREPAYMENT_MARKET_ALLOWLIST.includes(market));
}

export function evaluatePrepaymentEligibility({
  billingCountry,
  declaredCountry,
  ipCountry,
  buyerType,
  now = () => new Date(),
}) {
  const billing = countryCode(billingCountry);
  const declared = countryCode(declaredCountry);
  const ip = countryCode(ipCountry);
  const normalizedBuyerType = normalizeBuyerType(buyerType);

  if (billing === "CA") {
    return { status: "excluded", code: "CANADA_SALES_UNAVAILABLE" };
  }
  if (!billing || !RELEASE_1_MARKET_SET.has(billing)) {
    return { status: "excluded", code: "MARKET_NOT_IN_RELEASE_1" };
  }
  if (!declared || declared !== billing) {
    return { status: "review", code: "BILLING_COUNTRY_SELECTION_MISMATCH" };
  }
  if (!ip) {
    return { status: "review", code: "SERVER_IP_COUNTRY_UNAVAILABLE" };
  }
  if (ip !== billing) {
    return { status: "review", code: "LOCATION_SIGNALS_CONFLICT" };
  }
  if (!normalizedBuyerType) {
    return { status: "review", code: "BUYER_TYPE_UNAVAILABLE" };
  }

  // Existing matrix evidence has not approved the Address + IP pair as the
  // required New Zealand residence combination. Keep NZ in review until that
  // evidence is added; do not silently treat the two signals as sufficient.
  if (billing === "NZ") {
    return { status: "review", code: "NZ_RESIDENCE_SIGNAL_PAIR_UNCONFIRMED" };
  }

  if (!isPrepaymentMarketActivated(billing)) {
    return { status: "review", code: "MARKET_NOT_ACTIVATED" };
  }

  let checkedAt;
  try {
    checkedAt = now();
    if (!(checkedAt instanceof Date) || !Number.isFinite(checkedAt.getTime())) throw new Error();
  } catch {
    return { status: "review", code: "ELIGIBILITY_CLOCK_UNAVAILABLE" };
  }

  return {
    status: "eligible",
    version: ELIGIBILITY_VERSION,
    billingCountry: billing,
    ipCountry: ip,
    buyerType: normalizedBuyerType,
    checkedAt: checkedAt.toISOString(),
    expiresAt: new Date(checkedAt.getTime() + CHECK_TTL_MS).toISOString(),
    evidence: "billing_address_country+server_ip_country",
  };
}

export function validateCompletedCheckoutEligibility(session, {
  eventCreated = null,
  now = () => new Date(),
  enforceExpiry = true,
} = {}) {
  const metadata = session?.metadata || {};
  // Checkout Sessions expose a client secret capable of finalizing payment
  // before our server-side eligibility decision. Do not grandfather that
  // legacy flow if a market is later added to the allowlist.
  if (metadata.premivateCheckoutFlow !== "r2-server-finalized-v1") {
    return { status: "refund_review", code: "LEGACY_CLIENT_FINALIZED_CHECKOUT_UNSUPPORTED" };
  }
  const marketData = getCompletedMarketData(session);
  const billingCountry = countryCode(metadata.premivateEligibilityBillingCountry);
  const ipCountry = countryCode(metadata.premivateEligibilityIpCountry);
  const declaredCountry = countryCode(metadata.premivatePrecontractMarketScope);
  const expiresAt = Date.parse(metadata.premivateEligibilityExpiresAt || "");

  if (metadata.premivateCheckoutFlow !== ELIGIBILITY_VERSION ||
      metadata.premivateEligibilityVersion !== ELIGIBILITY_VERSION ||
      metadata.premivateEligibilityStatus !== "approved" ||
      !billingCountry || !ipCountry || billingCountry !== ipCountry ||
      !isPrepaymentMarketActivated(billingCountry) ||
      declaredCountry !== billingCountry || !marketData ||
      marketData.billingCountry !== billingCountry ||
      marketData.buyerType !== normalizeBuyerType(metadata.premivateBuyerType)) {
    return { status: "refund_review", code: "PREPAYMENT_ELIGIBILITY_MISMATCH" };
  }

  if (enforceExpiry) {
    const checkedAt = Date.parse(metadata.premivateEligibilityCheckedAt || "");
    let current;
    try { current = now().getTime(); } catch { current = NaN; }
    // Stripe event.created is second-precision. Allow the sub-second portion
    // of the eligibility check's timestamp without extending the 10-minute TTL.
    const referenceTime = Number.isSafeInteger(eventCreated) ? eventCreated * 1000 + 999 : current;
    if (!Number.isFinite(checkedAt) || !Number.isFinite(expiresAt) ||
        !Number.isFinite(referenceTime) || checkedAt > referenceTime || referenceTime > expiresAt) {
      return { status: "refund_review", code: "PREPAYMENT_ELIGIBILITY_EXPIRED" };
    }
  }

  return {
    status: "eligible",
    billingCountry,
    ipCountry,
    buyerType: marketData.buyerType,
    evidence: metadata.premivateEligibilityEvidence,
    checkedAt: metadata.premivateEligibilityCheckedAt,
  };
}

function getCompletedMarketData(session) {
  const country = countryCode(session?.customer_details?.address?.country);
  const buyerType = normalizeBuyerType(session?.metadata?.premivateBuyerType);
  if (!country || !buyerType) return null;
  return { billingCountry: country, buyerType };
}

export function getPrepaymentEligibilityMetadata(decision) {
  if (decision?.status !== "eligible" ||
      !isPrepaymentMarketActivated(decision.billingCountry) ||
      decision.billingCountry !== decision.ipCountry ||
      !normalizeBuyerType(decision.buyerType) ||
      !Number.isFinite(Date.parse(decision.checkedAt)) ||
      !Number.isFinite(Date.parse(decision.expiresAt))) {
    const error = new Error("PREPAYMENT_ELIGIBILITY_REQUIRED");
    error.status = 403;
    error.safeCode = "PREPAYMENT_ELIGIBILITY_REQUIRED";
    throw error;
  }

  return {
    premivateEligibilityVersion: ELIGIBILITY_VERSION,
    premivateEligibilityStatus: "approved",
    premivateEligibilityBillingCountry: decision.billingCountry,
    premivateEligibilityIpCountry: decision.ipCountry,
    premivateEligibilityCheckedAt: decision.checkedAt,
    premivateEligibilityExpiresAt: decision.expiresAt,
    premivateEligibilityEvidence: decision.evidence,
  };
}
