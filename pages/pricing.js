import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function PricingPage({ ui, t }) {
  const _t = typeof t === "function" ? t : (value) => value;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const checkoutTriggerRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const checkoutStatusRef = useRef(null);
  const checkoutStartedRef = useRef(false);
  const restoreTriggerFocusRef = useRef(false);
  const focusCheckoutStatusRef = useRef(false);

  useEffect(() => {
    if (!checkoutDialogOpen) return undefined;

    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreTriggerFocusRef.current = true;
        setCheckoutDialogOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableButtons = [
        cancelButtonRef.current,
        confirmButtonRef.current,
      ].filter(Boolean);

      if (focusableButtons.length < 2) return;

      const first = focusableButtons[0];
      const last = focusableButtons[focusableButtons.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (restoreTriggerFocusRef.current) {
        restoreTriggerFocusRef.current = false;

        requestAnimationFrame(() => {
          checkoutTriggerRef.current?.focus();
        });
      }
    };
  }, [checkoutDialogOpen]);

  useEffect(() => {
    if (!loading || !focusCheckoutStatusRef.current) return;

    focusCheckoutStatusRef.current = false;

    requestAnimationFrame(() => {
      checkoutStatusRef.current?.focus();
    });
  }, [loading]);

  function requestCheckout() {
    if (loading || checkoutStartedRef.current) return;

    restoreTriggerFocusRef.current = false;
    focusCheckoutStatusRef.current = false;
    setCheckoutDialogOpen(true);
  }

  function cancelCheckout() {
    restoreTriggerFocusRef.current = true;
    setCheckoutDialogOpen(false);
  }

  function confirmCheckout() {
    if (loading || checkoutStartedRef.current) return;

    restoreTriggerFocusRef.current = false;
    focusCheckoutStatusRef.current = true;
    setCheckoutDialogOpen(false);
    startCheckout();
  }

  async function startCheckout() {
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
        body: JSON.stringify({ plan: "pro" }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || ui.pricing.checkoutCouldNotStart);
      }

      window.location.href = data.url;
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
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: "16px",
                border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
                background: loading
                  ? "rgba(var(--premivate-gold-rgb),0.20)"
                  : "rgb(var(--premivate-gold-rgb))",
                color: "#17130C",
                fontWeight: 900,
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 18px 40px rgba(var(--premivate-gold-rgb),0.28)",
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
              Billing is currently being verified before public launch. Continue
              only if you intentionally want to test the checkout flow.
            </p>

            <Link href="/" style={secondaryButtonStyle}>
              Back to Generate
            </Link>
          </section>
        </div>

        {checkoutDialogOpen && (
          <div
            style={modalOverlayStyle}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                cancelCheckout();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-dialog-title"
              aria-describedby="checkout-dialog-description"
              style={modalStyle}
            >
              <div style={modalEyebrowStyle}>Checkout confirmation</div>

              <h2 id="checkout-dialog-title" style={modalTitleStyle}>
                Stripe Checkout öffnen?
              </h2>

              <p id="checkout-dialog-description" style={modalTextStyle}>
                Nur fortfahren, wenn du den Checkout bewusst testen möchtest.
              </p>

              <div style={modalActionsStyle}>
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={cancelCheckout}
                  style={modalCancelButtonStyle}
                >
                  Abbrechen
                </button>

                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={confirmCheckout}
                  style={modalConfirmButtonStyle}
                >
                  Checkout öffnen
                </button>
              </div>
            </div>
          </div>
        )}
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

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  display: "grid",
  placeItems: "center",
  padding: "20px",
  background: "rgba(0,0,0,0.72)",
  zIndex: 1000,
};

const modalStyle = {
  width: "min(100%, 520px)",
  padding: "clamp(24px, 5vw, 34px)",
  borderRadius: "24px",
  background: "#050505",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
  boxShadow: "0 28px 100px rgba(0,0,0,0.36)",
  boxSizing: "border-box",
};

const modalEyebrowStyle = {
  marginBottom: "14px",
  color: "rgb(var(--premivate-gold-rgb))",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const modalTitleStyle = {
  margin: "0 0 14px",
  fontSize: "28px",
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};

const modalTextStyle = {
  margin: "0 0 26px",
  color: "rgba(255,255,255,0.68)",
  lineHeight: 1.6,
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const modalCancelButtonStyle = {
  minWidth: "132px",
  padding: "13px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const modalConfirmButtonStyle = {
  minWidth: "160px",
  padding: "13px 18px",
  borderRadius: "999px",
  background: "rgb(var(--premivate-gold-rgb))",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
  color: "#17130C",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 30px rgba(var(--premivate-gold-rgb),0.20)",
};
