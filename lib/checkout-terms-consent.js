import { LEGAL_DOCUMENTS } from "../data/legal-documents";
import { CHECKOUT_PRECONTRACT_COPY } from "../data/checkout-precontract-copy";
import { CONTRACT_CONFIRMATION_VERSION } from "./contract-confirmation";
import { isPrepaymentMarketActivated } from "./prepayment-eligibility";

const CANADIAN_REGION_CODES = new Set([
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
]);
const RELEASE_1_COUNTRIES = new Set(["CH", "SG", "AU", "NZ"]);
const BUYER_TYPES = new Set([
  "consumer",
  "business_registered",
  "business_unregistered",
  "business_unknown",
]);

function consentError(status, code) {
  const error = new Error(code);
  error.status = status;
  error.safeCode = code;
  return error;
}

export function createCheckoutTermsConsent({
  accepted,
  locale,
  marketCountryScope,
  marketRegion,
  buyerType,
  frenchVersionPresented,
  alternativeLanguageChoice,
  env = process.env,
  now = () => new Date(),
}) {
  if (accepted !== true) {
    throw consentError(400, "TERMS_ACCEPTANCE_REQUIRED");
  }

  if (!['en', 'de', 'fr'].includes(locale)) {
    throw consentError(400, "TERMS_LOCALE_UNSUPPORTED");
  }

  if (!(marketCountryScope === "CA" || RELEASE_1_COUNTRIES.has(marketCountryScope)) ||
      typeof frenchVersionPresented !== "boolean" ||
      typeof alternativeLanguageChoice !== "boolean") {
    throw consentError(400, "PRECONTRACT_MARKET_DECLARATION_REQUIRED");
  }
  if ((marketCountryScope === "CA" && !CANADIAN_REGION_CODES.has(marketRegion)) ||
      (marketCountryScope !== "CA" && marketRegion !== "")) {
    throw consentError(400, "PRECONTRACT_MARKET_REGION_INVALID");
  }
  if (marketCountryScope === "CA") {
    throw consentError(403, "CANADA_SALES_UNAVAILABLE");
  }
  if (!isPrepaymentMarketActivated(marketCountryScope, env)) {
    throw consentError(403, "MARKET_NOT_ACTIVATED");
  }
  if (!BUYER_TYPES.has(buyerType)) {
    throw consentError(400, "PRECONTRACT_BUYER_TYPE_REQUIRED");
  }
  const quebec = marketCountryScope === "CA" && marketRegion === "QC";
  if ((quebec && (!frenchVersionPresented || (locale !== "fr" && !alternativeLanguageChoice))) ||
      (alternativeLanguageChoice && (!quebec || !frenchVersionPresented || locale === "fr")) ||
      (frenchVersionPresented && !quebec)) {
    throw consentError(400, "QUEBEC_LANGUAGE_CHOICE_INVALID");
  }

  const version = LEGAL_DOCUMENTS[locale]?.terms?.version;
  if (typeof version !== "string" || !version.trim()) {
    throw consentError(503, "TERMS_VERSION_UNAVAILABLE");
  }

  const isDraft = /working draft|arbeitsentwurf|projet de travail|not for publication|nicht zur veröffentlichung|non destiné à la publication/i
    .test(version);
  if (env.VERCEL_ENV === "production" && isDraft) {
    throw consentError(503, "TERMS_VERSION_NOT_APPROVED");
  }

  let acceptedAt;
  try {
    acceptedAt = now().toISOString();
  } catch {
    throw consentError(503, "TERMS_ACCEPTANCE_TIMESTAMP_UNAVAILABLE");
  }

  const copy = CHECKOUT_PRECONTRACT_COPY[locale];
  if (!copy) throw consentError(503, "PRECONTRACT_COPY_UNAVAILABLE");
  return {
    accepted: true,
    locale,
    version,
    acceptedAt,
    precontractDisclosure: {
      marketCountryScope,
      marketRegion,
      buyerType,
      frenchVersionPresented: quebec ? frenchVersionPresented : false,
      alternativeLanguageChoice: quebec && alternativeLanguageChoice,
      copy: {
        seller: copy.seller,
        proDescription: copy.proDescription,
        topupDescription: copy.topupDescription,
        proPayment: copy.proPayment,
        topupPayment: copy.topupPayment,
        performance: copy.performance,
        cancellation: copy.cancellation,
      },
    },
  };
}

export function checkoutTermsMetadata(consent) {
  if (!consent || consent.accepted !== true ||
      !["en", "de", "fr"].includes(consent.locale) ||
      typeof consent.version !== "string" ||
      typeof consent.acceptedAt !== "string" ||
      !consent.precontractDisclosure) {
    throw consentError(400, "TERMS_ACCEPTANCE_REQUIRED");
  }

  return {
    premivateTermsVersion: consent.version,
    premivateTermsLocale: consent.locale,
    premivateTermsAcceptedAt: consent.acceptedAt,
    premivatePrecontractMarketScope: consent.precontractDisclosure.marketCountryScope,
    premivatePrecontractRegion: consent.precontractDisclosure.marketRegion,
    premivateBuyerType: consent.precontractDisclosure.buyerType,
    premivateFrenchTermsPresented: String(consent.precontractDisclosure.frenchVersionPresented),
    premivateAlternativeLanguageChoice: String(consent.precontractDisclosure.alternativeLanguageChoice),
  };
}

export function earlyStartRequestMetadata({ confirmationId, requested, requestedAt }) {
  if (typeof confirmationId !== "string" || !confirmationId.trim() ||
      typeof requested !== "boolean" ||
      (requested && (typeof requestedAt !== "string" || !Number.isFinite(Date.parse(requestedAt)))) ||
      (!requested && requestedAt !== null)) {
    throw consentError(400, "EARLY_START_REQUEST_INVALID");
  }
  const metadata = {
    premivateContractConfirmationId: confirmationId,
    premivateEarlyStartRequested: String(requested),
    premivateEarlyStartVersion: CONTRACT_CONFIRMATION_VERSION,
  };
  if (requested) metadata.premivateEarlyStartRequestedAt = requestedAt;
  return metadata;
}
