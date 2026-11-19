import { useCallback, useEffect, useRef, useState } from "react";

const COPY = Object.freeze({
  en: {
    title: "Confirm your billing location and payment", contact: "Contact details", address: "Billing address",
    payment: "Payment method", total: "Total due now", pay: "Confirm and pay", cancel: "Cancel",
    loading: "Loading secure payment form…", checking: "Checking eligibility before payment…",
    name: "Full name", email: "Email", phone: "Phone (optional)", line1: "Address line 1", line2: "Address line 2 (optional)",
    city: "City", region: "State / region (optional)", postal: "Postal code", country: "Billing country",
    addressRequired: "Complete the required billing address fields before continuing.",
    blocked: "We could not confirm checkout eligibility. Check your billing country and try again, or contact support.",
    marketClosed: "Checkout for this market is not open yet.", tokenExpired: "This payment form expired. Close it and start again.",
    paymentDone: "Payment confirmed. Preparing your contract confirmation…", action: "Complete the requested payment verification…",
  },
  de: {
    title: "Rechnungsstandort und Zahlung bestätigen", contact: "Kontaktdaten", address: "Rechnungsadresse",
    payment: "Zahlungsmethode", total: "Jetzt fälliger Gesamtbetrag", pay: "Bestätigen und bezahlen", cancel: "Abbrechen",
    loading: "Sicheres Zahlungsformular wird geladen …", checking: "Berechtigung wird vor der Zahlung geprüft …",
    name: "Vollständiger Name", email: "E-Mail", phone: "Telefon (optional)", line1: "Adresszeile 1", line2: "Adresszeile 2 (optional)",
    city: "Ort", region: "Kanton / Region (optional)", postal: "Postleitzahl", country: "Rechnungsland",
    addressRequired: "Vervollständige die erforderlichen Rechnungsadressfelder.",
    blocked: "Die Checkout-Berechtigung konnte nicht bestätigt werden. Prüfe dein Rechnungsland oder wende dich an den Support.",
    marketClosed: "Der Checkout für diesen Markt ist noch nicht geöffnet.", tokenExpired: "Dieses Zahlungsformular ist abgelaufen. Schliesse es und beginne erneut.",
    paymentDone: "Zahlung bestätigt. Deine Vertragsbestätigung wird vorbereitet …", action: "Schliesse die angeforderte Zahlungsprüfung ab …",
  },
  fr: {
    title: "Confirmer votre adresse de facturation et le paiement", contact: "Coordonnées", address: "Adresse de facturation",
    payment: "Moyen de paiement", total: "Total dû maintenant", pay: "Confirmer et payer", cancel: "Annuler",
    loading: "Chargement du formulaire de paiement sécurisé…", checking: "Vérification de l’admissibilité avant paiement…",
    name: "Nom complet", email: "E-mail", phone: "Téléphone (facultatif)", line1: "Adresse, ligne 1", line2: "Adresse, ligne 2 (facultatif)",
    city: "Ville", region: "Région (facultatif)", postal: "Code postal", country: "Pays de facturation",
    addressRequired: "Complétez les champs requis de l’adresse de facturation.",
    blocked: "L’admissibilité au paiement n’a pas pu être confirmée. Vérifiez votre pays de facturation ou contactez l’assistance.",
    marketClosed: "Le paiement n’est pas encore ouvert pour ce marché.", tokenExpired: "Ce formulaire de paiement a expiré. Fermez-le et recommencez.",
    paymentDone: "Paiement confirmé. Préparation de votre confirmation de contrat…", action: "Terminez la vérification de paiement demandée…",
  },
});

const COUNTRIES = [
  ["CH", "Switzerland / Schweiz / Suisse"],
  ["SG", "Singapore"],
  ["AU", "Australia"],
  ["NZ", "New Zealand / Neuseeland / Nouvelle-Zélande"],
];

function loadStripeJs() {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-premivate-stripe="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://js.stripe.com/endive/stripe.js";
      script.async = true;
      script.dataset.premivateStripe = "true";
      document.head.appendChild(script);
    }
    const onLoad = () => window.Stripe ? resolve(window.Stripe) : reject(new Error("STRIPE_JS_UNAVAILABLE"));
    const onError = () => reject(new Error("STRIPE_JS_UNAVAILABLE"));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (window.Stripe) resolve(window.Stripe);
  });
}

function eligibilityError(code, copy) {
  return code === "MARKET_NOT_ACTIVATED" || code === "MARKET_NOT_IN_RELEASE_1" || code === "CANADA_SALES_UNAVAILABLE"
    ? copy.marketClosed
    : code === "CONFIRMATION_TOKEN_INVALID_OR_EXPIRED"
      ? copy.tokenExpired
      : copy.blocked;
}

function Field({ label, value, onChange, type = "text", required = false, autoComplete }) {
  return <label style={fieldLabel}>{label}{required ? " *" : ""}
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} autoComplete={autoComplete} style={fieldInput} />
  </label>;
}

export default function StripePrepaymentDialog({ open, session, locale = "en", onCancel }) {
  const paymentMount = useRef(null);
  const elementsRef = useRef(null);
  const stripeRef = useRef(null);
  const paymentElementRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState({ name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postal: "", country: "CH" });
  const copy = COPY[locale] || COPY.en;

  const unmount = useCallback(() => {
    try { paymentElementRef.current?.unmount(); } catch {}
    paymentElementRef.current = null;
    elementsRef.current = null;
    stripeRef.current = null;
  }, []);

  useEffect(() => {
    if (!open || !session?.confirmationId || !session?.publishableKey || !session?.amount) return undefined;
    let cancelled = false;
    setReady(false);
    setPaymentComplete(false);
    setError("");
    setBilling({ name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postal: "", country: "CH" });

    async function initialize() {
      try {
        const Stripe = await loadStripeJs();
        if (cancelled) return;
        const stripe = Stripe(session.publishableKey);
        const elements = stripe.elements({
          mode: session.serviceType === "pro" ? "subscription" : "payment",
          amount: session.amount,
          currency: session.currency.toLowerCase(),
          paymentMethodCreation: "manual",
          allowedPaymentMethodTypes: ["card"],
        });
        const paymentElement = elements.create("payment", { layout: "accordion" });
        paymentElement.on("change", (event) => {
          if (!cancelled) setPaymentComplete(event.complete === true);
        });
        paymentElement.mount(paymentMount.current);
        stripeRef.current = stripe;
        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError(copy.blocked);
      }
    }
    initialize();
    return () => { cancelled = true; unmount(); };
  }, [open, session?.confirmationId, session?.publishableKey, session?.amount, session?.currency, session?.serviceType, copy.blocked, unmount]);

  function setField(key, value) { setBilling((current) => ({ ...current, [key]: value })); }

  async function confirmPayment(event) {
    event.preventDefault();
    if (!ready || !paymentComplete || busy) return;
    setBusy(true);
    setError("");
    if (!billing.name.trim() || !billing.email.trim() || !billing.line1.trim() || !billing.city.trim() || !billing.postal.trim() || !COUNTRIES.some(([country]) => country === billing.country)) {
      setError(copy.addressRequired);
      setBusy(false);
      return;
    }
    try {
      const submit = await elementsRef.current.submit();
      if (submit?.error) throw submit.error;
      const { error: tokenError, confirmationToken } = await stripeRef.current.createConfirmationToken({
        elements: elementsRef.current,
        params: {
          payment_method_data: {
            billing_details: {
              name: billing.name.trim(),
              email: billing.email.trim(),
              phone: billing.phone.trim() || undefined,
              address: {
                line1: billing.line1.trim(),
                line2: billing.line2.trim() || undefined,
                city: billing.city.trim(),
                state: billing.state.trim() || undefined,
                postal_code: billing.postal.trim(),
                country: billing.country,
              },
            },
          },
          return_url: `${window.location.origin}/success?confirmation_id=${encodeURIComponent(session.confirmationId)}`,
        },
      });
      if (tokenError || !confirmationToken?.id) throw tokenError || new Error("CONFIRMATION_TOKEN_CREATE_FAILED");

      const response = await fetch("/api/finalize-prepayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationId: session.confirmationId, confirmationTokenId: confirmationToken.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(eligibilityError(data?.error, copy));

      if (data.status === "requires_action" && data.clientSecret) {
        const next = await stripeRef.current.handleNextAction({ clientSecret: data.clientSecret });
        if (next?.error) throw next.error;
        if (next?.paymentIntent?.status !== "succeeded") throw new Error(copy.action);
      } else if (data.status !== "succeeded") {
        throw new Error(copy.blocked);
      }
      window.location.assign(`/success?confirmation_id=${encodeURIComponent(session.confirmationId)}`);
    } catch (confirmError) {
      setError(confirmError?.message || copy.blocked);
      setBusy(false);
    }
  }

  if (!open) return null;
  const totalDue = new Intl.NumberFormat(locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : "en-CH", {
    style: "currency", currency: session?.currency?.toUpperCase() || "CHF",
  }).format((Number(session?.amount) || 0) / 100);
  return (
    <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel?.(); }} style={{ position: "fixed", inset: 0, zIndex: 10010, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,0.82)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby="prepayment-title" style={{ width: "min(100%, 620px)", maxHeight: "92vh", overflowY: "auto", padding: 26, borderRadius: 20, border: "1px solid rgba(255,255,255,0.16)", background: "#12110f", color: "#f6f3eb", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <h2 id="prepayment-title" style={{ margin: "0 0 14px", fontSize: 24 }}>{copy.title}</h2>
        {!ready && !error ? <p role="status">{copy.loading}</p> : null}
        <form onSubmit={confirmPayment}>
          <h3 style={sectionTitle}>{copy.contact}</h3>
          <Field label={copy.name} value={billing.name} onChange={(value) => setField("name", value)} required autoComplete="name" />
          <Field label={copy.email} type="email" value={billing.email} onChange={(value) => setField("email", value)} required autoComplete="email" />
          <Field label={copy.phone} type="tel" value={billing.phone} onChange={(value) => setField("phone", value)} autoComplete="tel" />
          <h3 style={sectionTitle}>{copy.address}</h3>
          <Field label={copy.line1} value={billing.line1} onChange={(value) => setField("line1", value)} required autoComplete="address-line1" />
          <Field label={copy.line2} value={billing.line2} onChange={(value) => setField("line2", value)} autoComplete="address-line2" />
          <Field label={copy.city} value={billing.city} onChange={(value) => setField("city", value)} required autoComplete="address-level2" />
          <Field label={copy.region} value={billing.state} onChange={(value) => setField("state", value)} autoComplete="address-level1" />
          <Field label={copy.postal} value={billing.postal} onChange={(value) => setField("postal", value)} required autoComplete="postal-code" />
          <label style={fieldLabel}>{copy.country} *
            <select value={billing.country} onChange={(event) => setField("country", event.target.value)} required style={fieldInput}>
              {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <h3 style={sectionTitle}>{copy.payment}</h3>
          <div ref={paymentMount} />
          <p style={{ margin: "20px 0 14px", fontWeight: 800 }}>{copy.total}: {totalDue}</p>
          {busy ? <p role="status" aria-live="polite">{copy.checking}</p> : null}
          {error ? <p role="alert" style={{ color: "#fca5a5", lineHeight: 1.5 }}>{error}</p> : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={onCancel} disabled={busy} style={buttonStyle}>{copy.cancel}</button>
            <button type="submit" disabled={!ready || !paymentComplete || busy} style={{ ...buttonStyle, ...payButtonStyle, opacity: !ready || !paymentComplete || busy ? 0.5 : 1 }}>{copy.pay} · {totalDue}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

const sectionTitle = { margin: "20px 0 10px", fontSize: 15 };
const fieldLabel = { display: "grid", gap: 6, margin: "10px 0", color: "rgba(246,243,235,0.82)", fontSize: 13 };
const fieldInput = { width: "100%", boxSizing: "border-box", minHeight: 42, padding: "9px 11px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.20)", background: "#f9f7f2", color: "#181612", font: "inherit" };
const buttonStyle = { minHeight: 42, padding: "10px 15px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.05)", color: "#f6f3eb", fontWeight: 700, cursor: "pointer" };
const payButtonStyle = { border: "1px solid rgba(var(--premivate-gold-rgb),0.35)", background: "rgb(var(--premivate-gold-rgb))", color: "#17130C" };
