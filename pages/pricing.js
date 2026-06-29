import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    const confirmed = window.confirm(
      "Stripe Checkout öffnen? Nur fortfahren, wenn du den Checkout bewusst testen möchtest."
    );

    if (!confirmed) return;

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
        throw new Error(data.error || "Checkout konnte nicht gestartet werden.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Checkout konnte nicht gestartet werden.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.26), transparent 34%), #050505",
        color: "white",
        padding: "72px 72px 120px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1040px" }}>
        <div
          style={{
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#c084fc",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "28px",
          }}
        >
          FrameLab Pricing
        </div>

        <h1
          style={{
            fontSize: "72px",
            lineHeight: "0.95",
            margin: "0 0 28px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
          }}
        >
          Upgrade your cinematic workflow.
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.68)",
            fontSize: "19px",
            lineHeight: 1.6,
            maxWidth: "760px",
            marginBottom: "42px",
          }}
        >
          FrameLab Pro is prepared for premium creative generation. Billing is currently in test/build phase and should be verified before public launch.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
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
              FrameLab Pro
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.64)",
                fontSize: "16px",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              Unlimited cinematic AI reel generations, premium prompt systems and creative direction workflows.
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
                }}
              >
                CHF 19
              </span>
              <span style={{ color: "rgba(255,255,255,0.52)" }}>/ month</span>
            </div>

            <button
              onClick={startCheckout}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: "16px",
                border: "none",
                background: loading
                  ? "rgba(168,85,247,0.42)"
                  : "linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)",
                color: "white",
                fontWeight: 900,
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 18px 50px rgba(124,58,237,0.32)",
              }}
            >
              {loading ? "Opening Checkout..." : "Start Pro Checkout"}
            </button>

            {error && (
              <p
                style={{
                  marginTop: "18px",
                  color: "#fca5a5",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            )}
          </section>

          <section style={sideCardStyle}>
            <h2 style={cardTitle}>Current Restore Status</h2>

            <p style={cardText}>
              Pricing is restored as a safe visual route so FrameLab no longer sends users to a missing page.
            </p>

            <div style={miniList}>
              <div style={miniItem}>✓ Premium page exists</div>
              <div style={miniItem}>✓ Checkout API connected</div>
              <div style={miniItem}>✓ Test confirmation before redirect</div>
              <div style={miniItemMuted}>Webhook automation still pending</div>
              <div style={miniItemMuted}>Billing portal still pending</div>
            </div>

            <Link href="/" style={secondaryButtonStyle}>
              Back to Generate
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

const proCardStyle = {
  padding: "34px",
  borderRadius: "28px",
  background:
    "linear-gradient(180deg, rgba(124,58,237,0.18), rgba(255,255,255,0.045))",
  border: "1px solid rgba(168,85,247,0.28)",
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
  background: "rgba(168,85,247,0.18)",
  border: "1px solid rgba(168,85,247,0.28)",
  color: "#f5d0fe",
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

const miniList = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginBottom: "28px",
};

const miniItem = {
  color: "rgba(255,255,255,0.88)",
  fontWeight: 700,
};

const miniItemMuted = {
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
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
