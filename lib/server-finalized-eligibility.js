import { isPrepaymentMarketActivated, normalizeBuyerType } from "./prepayment-eligibility";

export const SERVER_FINALIZED_CHECKOUT_FLOW = "r2-server-finalized-v1";

function countryCode(value) {
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
}

export function validateServerFinalizedEligibilityMetadata(metadata, {
  eventCreated = null,
  now = () => new Date(),
  enforceExpiry = true,
  requireActivated = true,
} = {}) {
  const billingCountry = countryCode(metadata?.premivateEligibilityBillingCountry);
  const ipCountry = countryCode(metadata?.premivateEligibilityIpCountry);
  const declaredCountry = countryCode(metadata?.premivatePrecontractMarketScope);
  const buyerType = normalizeBuyerType(metadata?.premivateBuyerType);
  if (metadata?.premivateCheckoutFlow !== SERVER_FINALIZED_CHECKOUT_FLOW ||
      metadata?.premivateEligibilityVersion !== SERVER_FINALIZED_CHECKOUT_FLOW ||
      metadata?.premivateEligibilityStatus !== "approved" ||
      !billingCountry || !ipCountry || billingCountry !== ipCountry ||
      declaredCountry !== billingCountry || !buyerType ||
      metadata?.premivateEligibilityEvidence !== "confirmation_token_billing_country+server_ip_country" ||
      !metadata?.premivateEligibilityCheckedAt || !metadata?.premivateEligibilityExpiresAt ||
      (requireActivated && !isPrepaymentMarketActivated(billingCountry))) {
    return { status: "refund_review", code: "PREPAYMENT_ELIGIBILITY_MISMATCH" };
  }
  if (enforceExpiry) {
    const checkedAt = Date.parse(metadata.premivateEligibilityCheckedAt);
    const expiresAt = Date.parse(metadata.premivateEligibilityExpiresAt);
    let current;
    try { current = now().getTime(); } catch { current = NaN; }
    const referenceTime = Number.isSafeInteger(eventCreated) ? eventCreated * 1000 + 999 : current;
    if (!Number.isFinite(checkedAt) || !Number.isFinite(expiresAt) ||
        expiresAt - checkedAt > 10 * 60 * 1000 || expiresAt <= checkedAt ||
        !Number.isFinite(referenceTime) || checkedAt > referenceTime || referenceTime > expiresAt) {
      return { status: "refund_review", code: "PREPAYMENT_ELIGIBILITY_EXPIRED" };
    }
  }
  return { status: "eligible", billingCountry, ipCountry, buyerType };
}
