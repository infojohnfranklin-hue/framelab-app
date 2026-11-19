import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CheckoutTermsDialog from "../components/CheckoutTermsDialog";
import StripePrepaymentDialog from "../components/StripePrepaymentDialog";
import { hasAnyActivatedPrepaymentMarket } from "../lib/prepayment-eligibility";

export default function PricingPage({ ui, language }) {
  const prepaymentMarketsOpen = hasAnyActivatedPrepaymentMarket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [earlyStartRequested, setEarlyStartRequested] = useState(false);
  const checkoutTriggerRef = useRef(null);
  const checkoutStatusRef = useRef(null);
  const checkoutStartedRef = useRef(false);
  const restoreTriggerFocusRef = useRef(false);
  const focusCheckoutStatusRef = useRef(false);

  useEffect(() => {
    if (checkoutDialogOpen || !restoreTriggerFocusRef.current) return;
    restoreTriggerFocusRef.current = false;
    requestAnimationFrame(() => checkoutTriggerRef.current?.focus());
  }, [checkoutDialogOpen]);

  useEffect(() => {
    if (!loading || !focusCheckoutStatusRef.current) return;

    focusCheckoutStatusRef.current = false;

    requestAnimationFrame(() => {
      checkoutStatusRef.current?.focus();
    });
  }, [loading]);

  function requestCheckout() {
    if (!prepaymentMarketsOpen || loading || checkoutStartedRef.current) return;

    restoreTriggerFocusRef.current = false;
    focusCheckoutStatusRef.current = false;
    setTermsAccepted(false);
    setEarlyStartRequested(false);
    setCheckoutDialogOpen(true);
  }

  function cancelCheckout() {
    restoreTriggerFocusRef.current = true;
    setTermsAccepted(false);
    setEarlyStartRequested(false);
    setCheckoutDialogOpen(false);
  }

  function cancelPayment() {
    const confirmationId = checkoutSession?.confirmationId;
    setCheckoutSession(null);
    setLoading(false);
    checkoutStartedRef.current = false;
    if (confirmationId) {
      fetch("/api/cancel-prepayment-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationId }),
      }).catch(() => {});
    }
  }

  function confirmCheckout(disclosure = {}) {
    if (loading || checkoutStartedRef.current || !termsAccepted) return;

    restoreTriggerFocusRef.current = false;
    focusCheckoutStatusRef.current = true;
    setCheckoutDialogOpen(false);
    startCheckout(earlyStartRequested, disclosure);
  }

  async function startCheckout(requestEarlyStart, disclosure) {
    if (checkoutStartedRef.current) return;

    checkoutStartedRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "pro",
          termsAccepted: true,
          termsLocale: disclosure.termsLocale || (language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en"),
          earlyStartRequested: requestEarlyStart === true,
          marketCountryScope: disclosure.marketCountryScope,
          marketRegion: disclosure.marketRegion,
          buyerType: disclosure.buyerType,
          frenchVersionPresented: disclosure.frenchVersionPresented,
          alternativeLanguageChoice: disclosure.alternativeLanguageChoice,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.confirmationId || !data.amount || !data.currency || !data.publishableKey) {
        throw new Error(data.error || ui.pricing.checkoutCouldNotStart);
      }
      setCheckoutSession(data);
      setLoading(false);
    } catch (err) {
      checkoutStartedRef.current = false;
      setError(err.message || ui.pricing.checkoutCouldNotStart);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(var(--premivate-gold-rgb),0.20), transparent 34%), #050505",
        color: "white",
        padding: "clamp(32px, 6vw, 72px) clamp(20px, 6vw, 72px) 96px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1040px" }}>
        <div
          style={{
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgb(var(--premivate-gold-rgb))",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "28px",
          }}
        >{ui.pricing.title}</div>

        <h1
          style={{
            fontSize: "clamp(46px, 7vw, 72px)",
            lineHeight: "0.95",
            margin: "0 0 28px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
          }}
        >{ui.pricing.headline}</h1>

        <p
          style={{
            color: "rgba(255,255,255,0.68)",
            fontSize: "19px",
            lineHeight: 1.6,
            maxWidth: "760px",
            marginBottom: "42px",
          }}
        >
          Premivate Pro brings premium creative generation, cinematic prompt systems and focused creative direction into one production workflow.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          <section style={proCardStyle}>
            <div style={badgeStyle}>Pro Plan</div>

            <h2
              style={{
                fontSize: "42px",
                lineHeight: 1,
                margin: "24px 0 12px",
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              Premivate Pro
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.64)",
                fontSize: "16px",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              Premium cinematic AI reel concepts, prompt systems and creative direction workflows.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontSize: "54px",
                  fontWeight: 900,
                  letterSpacing: "-0.06em",
                  color: "rgb(var(--premivate-gold-rgb))",
                }}
              >
                CHF 24.00
              </span>
              <span style={{ color: "rgba(255,255,255,0.52)" }}>/ month</span>
            </div>

            <button
              ref={checkoutTriggerRef}
              onClick={requestCheckout}
              disabled={loading || !prepaymentMarketsOpen}
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: "16px",
                border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
                background: loading || !prepaymentMarketsOpen
                  ? "rgba(var(--premivate-gold-rgb),0.20)"
                  : "rgb(var(--premivate-gold-rgb))",
                color: "#17130C",
                fontWeight: 900,
                fontSize: "15px",
                cursor: loading || !prepaymentMarketsOpen ? "not-allowed" : "pointer",
                boxShadow: prepaymentMarketsOpen ? "0 18px 40px rgba(var(--premivate-gold-rgb),0.28)" : "none",
              }}
            >
              {loading ? "Opening Checkout..." : "Start Pro Checkout"}
            </button>

            <div
              ref={checkoutStatusRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              style={{
                marginTop: loading || error ? "16px" : 0,
                minHeight: loading || error ? "20px" : 0,
                color: error ? "#fca5a5" : "rgba(255,255,255,0.62)",
                fontSize: "13px",
                lineHeight: 1.5,
                outline: "none",
              }}
            >
              {loading ? "Opening Checkout..." : error}
            </div>
          </section>

          <section style={sideCardStyle}>
            <h2 style={cardTitle}>Checkout Preview</h2>

            <p style={cardText}>
              {prepaymentMarketsOpen
                ? "Billing is currently being verified before public launch. Continue only if you intentionally want to test the checkout flow."
                : "Pro checkout is currently unavailable while launch markets are being verified."}
            </p>

            <Link href="/" style={secondaryButtonStyle}>
              Back to Generate
            </Link>
          </section>
        </div>

        <CheckoutTermsDialog
          open={checkoutDialogOpen}
          language={language || "English"}
          locale={language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en"}
          summary="PREMIVATE Pro · CHF 24.00 / month"
          checked={termsAccepted}
          onCheckedChange={setTermsAccepted}
          serviceType="pro"
          earlyStartRequested={earlyStartRequested}
          onEarlyStartRequestedChange={setEarlyStartRequested}
          onCancel={cancelCheckout}
          onConfirm={confirmCheckout}
          busy={loading}
        />
        <StripePrepaymentDialog
          open={Boolean(checkoutSession)}
          session={checkoutSession}
          locale={language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en"}
          onCancel={cancelPayment}
        />
      </div>
    </div>
  );
}

const proCardStyle = {
  padding: "34px",
  borderRadius: "28px",
  background:
    "linear-gradient(180deg, rgba(var(--premivate-gold-rgb),0.20), rgba(255,255,255,0.045))",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
  boxShadow: "0 28px 100px rgba(0,0,0,0.36)",
};

const sideCardStyle = {
  padding: "34px",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
};

const badgeStyle = {
  display: "inline-flex",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(var(--premivate-gold-rgb),0.20)",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
  color: "rgb(var(--premivate-gold-rgb))",
  fontSize: "13px",
  fontWeight: 800,
};

const cardTitle = {
  margin: "0 0 16px",
  fontSize: "26px",
  fontWeight: 900,
};

const cardText = {
  margin: "0 0 24px",
  color: "rgba(255,255,255,0.62)",
  lineHeight: 1.6,
};

const secondaryButtonStyle = {
  display: "inline-flex",
  padding: "13px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "13px",
};
