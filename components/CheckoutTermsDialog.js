import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHECKOUT_TERMS_COPY } from "../data/languages";
import { EU_EARLY_START_COPY } from "../data/contract-confirmation-copy";
import { CHECKOUT_PRECONTRACT_COPY } from "../data/checkout-precontract-copy";

const CANADIAN_REGIONS = [
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"],
  ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"], ["NT", "Northwest Territories"], ["NU", "Nunavut"],
  ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Québec"],
  ["SK", "Saskatchewan"], ["YT", "Yukon"],
];

function languageName(locale) {
  return locale === "de" ? "Deutsch" : locale === "fr" ? "Français" : "English";
}

export default function CheckoutTermsDialog({
  open,
  language,
  locale,
  summary,
  checked,
  onCheckedChange,
  onCancel,
  onConfirm,
  busy = false,
  serviceType,
  earlyStartRequested = false,
  onEarlyStartRequestedChange,
}) {
  const dialogRef = useRef(null);
  const checkboxRef = useRef(null);
  const baseLocale = ["en", "de", "fr"].includes(locale) ? locale : "en";
  const [billingScope, setBillingScope] = useState("");
  const [billingRegion, setBillingRegion] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [termsLocale, setTermsLocale] = useState(baseLocale);
  const [frenchVersionOpened, setFrenchVersionOpened] = useState(false);
  const [alternativeLanguageChoice, setAlternativeLanguageChoice] = useState(false);
  const copy = CHECKOUT_TERMS_COPY[languageName(termsLocale)] || CHECKOUT_TERMS_COPY.English;
  const disclosure = CHECKOUT_PRECONTRACT_COPY[termsLocale] || CHECKOUT_PRECONTRACT_COPY.en;
  const termsHref = termsLocale === "de" ? "/terms?lang=de" : termsLocale === "fr" ? "/terms?lang=fr" : "/terms?lang=en";
  const isCanada = billingScope === "CA";
  const isQuebec = isCanada && billingRegion === "QC";
  const jurisdictionReady = ["CH", "SG", "AU"].includes(billingScope);
  const languageChoiceReady = !isQuebec || (
    frenchVersionOpened && (termsLocale === "fr" || alternativeLanguageChoice)
  );
  const canContinue = checked && !busy && jurisdictionReady && Boolean(buyerType) && languageChoiceReady && !isCanada;
  const earlyStartCopy = serviceType === "pro"
    ? EU_EARLY_START_COPY[termsLocale]?.proRequest
    : serviceType === "credit_topup"
      ? EU_EARLY_START_COPY[termsLocale]?.topupRequest
      : null;
  const earlyStartNotice = EU_EARLY_START_COPY[termsLocale]?.notice;

  useEffect(() => {
    if (!open) return;
    setBillingScope("");
    setBillingRegion("");
    setBuyerType("");
    setTermsLocale(baseLocale);
    setFrenchVersionOpened(false);
    setAlternativeLanguageChoice(false);
  }, [open, baseLocale]);

  function updateBillingScope(value) {
    setBillingScope(value);
    setBillingRegion("");
    setFrenchVersionOpened(false);
    setAlternativeLanguageChoice(false);
    setTermsLocale(baseLocale);
    onCheckedChange(false);
  }

  function updateBillingRegion(value) {
    setBillingRegion(value);
    setFrenchVersionOpened(false);
    setAlternativeLanguageChoice(false);
    setTermsLocale(value === "QC" ? "fr" : baseLocale);
    onCheckedChange(false);
  }

  useEffect(() => {
    if (!open) return undefined;

    requestAnimationFrame(() => checkboxRef.current?.focus());

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(
          'input:not([disabled]), a[href], button:not([disabled])'
        ) || []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "rgba(0,0,0,0.76)",
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-terms-title"
        aria-describedby="checkout-terms-description"
        style={{
          width: "min(100%, 560px)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: "20px",
          padding: "28px",
          color: "#f6f3eb",
          background: "#12110f",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <h2 id="checkout-terms-title" style={{ margin: "0 0 12px", fontSize: "24px" }}>
          {copy.dialogTitle}
        </h2>
        <p id="checkout-terms-description" style={{ lineHeight: 1.55, color: "rgba(246,243,235,0.76)" }}>
          {copy.dialogDescription}
        </p>
        {summary ? (
          <p style={{ fontWeight: 700, color: "rgb(var(--premivate-gold-rgb))" }}>
            {summary}
          </p>
        ) : null}

        <section aria-labelledby="checkout-offer-details-title" style={{ margin: "18px 0", padding: "16px", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "14px", background: "rgba(255,255,255,0.035)" }}>
          <h3 id="checkout-offer-details-title" style={{ margin: "0 0 10px", fontSize: "16px" }}>{disclosure.title}</h3>
          <p style={{ margin: "0 0 12px", lineHeight: 1.5, color: "rgba(246,243,235,0.76)" }}>{disclosure.description}</p>
          <label style={{ display: "grid", gap: "6px", marginBottom: "10px", fontSize: "14px" }}>
            {disclosure.billingScope}
            <select value={billingScope} onChange={(event) => updateBillingScope(event.target.value)} style={selectStyle}>
              <option value="">{disclosure.chooseScope}</option>
              <option value="CH">{disclosure.switzerland}</option>
              <option value="SG">{disclosure.singapore}</option>
              <option value="AU">{disclosure.australia}</option>
              <option value="NZ">{disclosure.newZealand}</option>
              <option value="CA">{disclosure.canada}</option>
            </select>
          </label>
          {isCanada ? (
            <label style={{ display: "grid", gap: "6px", marginBottom: "12px", fontSize: "14px" }}>
              {disclosure.province}
              <select value={billingRegion} onChange={(event) => updateBillingRegion(event.target.value)} style={selectStyle}>
                <option value="">{disclosure.chooseProvince}</option>
                {CANADIAN_REGIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </label>
          ) : null}
          {isCanada ? (
            <p role="status" aria-live="polite" style={{ margin: "8px 0 12px", lineHeight: 1.5, color: "rgb(var(--premivate-gold-rgb))" }}>
              {disclosure.canadaUnavailable}
            </p>
          ) : null}
          {billingScope === "NZ" ? (
            <p role="status" aria-live="polite" style={{ margin: "8px 0 12px", lineHeight: 1.5, color: "rgb(var(--premivate-gold-rgb))" }}>
              {disclosure.newZealandUnavailable}
            </p>
          ) : null}
          {isQuebec ? (
            <div style={{ margin: "12px 0", padding: "12px", borderRadius: "10px", background: "rgba(var(--premivate-gold-rgb),0.08)" }}>
              <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{disclosure.frenchFirst}</p>
              <Link href="/terms?lang=fr" target="_blank" rel="noreferrer" onClick={() => setFrenchVersionOpened(true)} style={{ color: "rgb(var(--premivate-gold-rgb))" }}>
                {disclosure.frenchTerms}
              </Link>
              {frenchVersionOpened && baseLocale !== "fr" ? (
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "12px", lineHeight: 1.45 }}>
                  <input type="checkbox" checked={alternativeLanguageChoice} onChange={(event) => {
                    setAlternativeLanguageChoice(event.target.checked);
                    setTermsLocale(event.target.checked ? baseLocale : "fr");
                    onCheckedChange(false);
                  }} style={{ marginTop: "4px", flex: "0 0 auto" }} />
                  <span>{disclosure.chooseOtherLanguage}</span>
                </label>
              ) : null}
            </div>
          ) : null}
          <label style={{ display: "grid", gap: "6px", margin: "10px 0", fontSize: "14px" }}>
            {disclosure.buyerType}
            <select value={buyerType} onChange={(event) => {
              setBuyerType(event.target.value);
              onCheckedChange(false);
            }} style={selectStyle}>
              <option value="">{disclosure.chooseBuyerType}</option>
              <option value="consumer">{disclosure.buyerConsumer}</option>
              <option value="business_registered">{disclosure.buyerBusinessRegistered}</option>
              <option value="business_unregistered">{disclosure.buyerBusinessUnregistered}</option>
              <option value="business_unknown">{disclosure.buyerBusinessUnknown}</option>
            </select>
          </label>
          <ul style={{ margin: "12px 0 0", paddingLeft: "20px", lineHeight: 1.5, color: "rgba(246,243,235,0.82)" }}>
            <li>{disclosure.seller}</li>
            <li>{serviceType === "pro" ? disclosure.proDescription : disclosure.topupDescription}</li>
            <li>{serviceType === "pro" ? disclosure.proPayment : disclosure.topupPayment}</li>
            <li>{disclosure.performance}</li>
            <li>{disclosure.cancellation}</li>
          </ul>
        </section>

        <div style={{ margin: "20px 0", lineHeight: 1.5 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={checked}
              onChange={(event) => onCheckedChange(event.target.checked)}
              style={{ marginTop: "4px", flex: "0 0 auto" }}
            />
            <span>{copy.acceptTerms}</span>
          </label>
          <p style={{ margin: "8px 0 0 26px" }}>
            <Link href={termsHref} target="_blank" rel="noreferrer" style={{ color: "rgb(var(--premivate-gold-rgb))" }}>
              {termsLocale === "de" ? copy.termsLinkDe : termsLocale === "fr" ? "Conditions de service" : copy.termsLinkEn}
            </Link>
          </p>
          {termsLocale === "en" && language !== "English" ? (
            <p style={{ margin: "8px 0 0 26px", fontSize: "13px", color: "rgba(246,243,235,0.62)" }}>
              {copy.englishTermsNotice}
            </p>
          ) : null}
        </div>

        {earlyStartCopy ? (
          <div style={{ margin: "16px 0 20px", lineHeight: 1.5 }}>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "rgba(246,243,235,0.68)" }}>
              {earlyStartNotice}
            </p>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <input
                type="checkbox"
                checked={earlyStartRequested === true}
                onChange={(event) => onEarlyStartRequestedChange?.(event.target.checked)}
                style={{ marginTop: "4px", flex: "0 0 auto" }}
              />
              <span>{earlyStartCopy}</span>
            </label>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          <button type="button" onClick={onCancel} style={buttonStyle}>
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm({
              termsLocale,
              marketCountryScope: billingScope,
              marketRegion: billingScope === "CA" ? billingRegion : "",
              buyerType,
              frenchVersionPresented: frenchVersionOpened,
              alternativeLanguageChoice,
            })}
            disabled={!canContinue}
            style={{ ...buttonStyle, ...confirmButtonStyle, opacity: !canContinue ? 0.55 : 1 }}
          >
            {busy ? copy.openingCheckout : copy.continueToCheckout}
          </button>
        </div>
      </section>
    </div>
  );
}

const selectStyle = {
  minHeight: "42px",
  borderRadius: "10px",
  padding: "8px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "#171614",
  color: "#f6f3eb",
};

const buttonStyle = {
  minHeight: "44px",
  borderRadius: "12px",
  padding: "10px 16px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "#f6f3eb",
  fontWeight: 700,
  cursor: "pointer",
};

const confirmButtonStyle = {
  border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
  background: "rgb(var(--premivate-gold-rgb))",
  color: "#17130C",
};
