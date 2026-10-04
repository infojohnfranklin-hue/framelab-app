import { useState } from "react";
import Link from "next/link";

export default function ExportsPage({ ui, t }) {
  const _t = typeof t === "function" ? t : (value) => value;
  const [ctaHovered, setCtaHovered] = useState(false);
  const [ctaFocused, setCtaFocused] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg, rgba(7,7,8,0.94) 0%, rgba(7,7,8,0.80) 40%, rgba(7,7,8,0.54) 72%, rgba(7,7,8,0.46) 100%), linear-gradient(180deg, rgba(9,8,6,0.18) 0%, rgba(9,8,6,0.36) 58%, rgba(9,8,6,0.78) 100%), url('/framelab-premium-Export-assets/ChatGPT Image 24. Sept. 2026, 15_24_28.png'), #090A0C",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        color: "rgba(246,243,235,0.96)",
        padding: "72px 72px 120px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1080px" }}>
        <div
          style={{
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(216,181,106,0.88)",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "28px",
          }}
        >{ui.exports.title}</div>

        <h1
          style={{
            fontSize: "72px",
            lineHeight: "0.95",
            margin: "0 0 28px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            maxWidth: "940px",
            textShadow: "0 16px 48px rgba(0,0,0,0.34)",
          }}
        >{ui.exports.headline}</h1>

        <p
          style={{
            color: "rgba(246,243,235,0.68)",
            fontSize: "19px",
            lineHeight: 1.6,
            maxWidth: "760px",
            marginBottom: "42px",
          }}
        >{ui.exports.intro}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "22px",
            marginBottom: "34px",
          }}
        >
          <section style={{ ...cardStyle, ...primaryCardStyle }}>
            <h2 style={cardTitle}>{ui.exports.projectExports}</h2>
            <p style={cardText}>{ui.exports.projectExportsText}</p>

            <Link
              href="/history"
              style={{
                ...buttonStyle,
                ...(ctaHovered ? buttonHoverStyle : {}),
                ...(ctaFocused ? buttonFocusStyle : {}),
              }}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              onFocus={() => setCtaFocused(true)}
              onBlur={() => setCtaFocused(false)}
            >
              {ui.exports.openHistory}
            </Link>
          </section>

          <section style={{ ...cardStyle, ...secondaryCardStyle }}>
            <h2 style={cardTitle}>{ui.exports.exportTypes}</h2>
            <p style={cardText}>{ui.exports.exportTypesText}</p>

            <div style={badgeRow}>
              <span style={badgeStyle}>AI Video Prompt</span>
              <span style={badgeStyle}>Captions</span>
              <span style={badgeStyle}>Hooks</span>
              <span style={badgeStyle}>Director Notes</span>
            </div>
          </section>

          <section style={{ ...cardStyle, ...statusCardStyle }}>
            <h2 style={statusCardTitle}>{ui.exports.currentStatus}</h2>
            <p style={statusCardText}>{ui.exports.currentStatusText}</p>

            <div style={statusBadgeStyle}>{ui.exports.historyLinked}</div>
          </section>

          <section style={{ ...cardStyle, ...statusCardStyle }}>
            <h2 style={statusCardTitle}>{ui.exports.restoreStatus}</h2>
            <p style={statusCardText}>{ui.exports.restoreText}</p>

            <div style={statusBadgeStyle}>Safe restore active</div>
          </section>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "28px",
  borderRadius: "24px",
  background:
    "linear-gradient(145deg, rgba(24,22,18,0.82) 0%, rgba(14,14,14,0.88) 58%, rgba(9,10,11,0.92) 100%)",
  border: "1px solid rgba(246,243,235,0.09)",
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.34), inset 0 1px 0 rgba(246,243,235,0.025)",
  backdropFilter: "blur(12px)",
};

const primaryCardStyle = {
  background:
    "linear-gradient(145deg, rgba(46,38,23,0.90) 0%, rgba(22,20,16,0.92) 48%, rgba(11,12,13,0.94) 100%)",
  border: "1px solid rgba(216,181,106,0.28)",
  boxShadow:
    "0 28px 90px rgba(0,0,0,0.42), 0 12px 44px rgba(138,101,38,0.10), inset 0 1px 0 rgba(231,204,145,0.07)",
};

const secondaryCardStyle = {
  border: "1px solid rgba(216,181,106,0.15)",
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.34), inset 0 1px 0 rgba(231,204,145,0.035)",
};

const statusCardStyle = {
  background:
    "linear-gradient(145deg, rgba(18,18,17,0.78) 0%, rgba(11,12,13,0.88) 100%)",
  border: "1px solid rgba(246,243,235,0.07)",
  boxShadow:
    "0 18px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(246,243,235,0.02)",
};

const cardTitle = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: 800,
  color: "rgba(246,243,235,0.96)",
};

const statusCardTitle = {
  ...cardTitle,
  color: "rgba(246,243,235,0.82)",
};

const cardText = {
  margin: "0 0 24px",
  color: "rgba(246,243,235,0.62)",
  lineHeight: 1.55,
};

const statusCardText = {
  ...cardText,
  color: "rgba(246,243,235,0.50)",
};

const buttonStyle = {
  display: "inline-flex",
  padding: "13px 18px",
  borderRadius: "12px",
  background:
    "linear-gradient(135deg, rgba(184,138,59,0.98) 0%, rgba(231,204,145,0.98) 100%)",
  border: "1px solid rgba(246,225,174,0.22)",
  color: "#17130C",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "13px",
  boxShadow: "0 16px 42px rgba(216,181,106,0.18)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
};

const buttonHoverStyle = {
  transform: "translateY(-1px)",
  borderColor: "rgba(246,225,174,0.34)",
  boxShadow:
    "0 18px 46px rgba(216,181,106,0.24), 0 0 0 1px rgba(246,225,174,0.05)",
};

const buttonFocusStyle = {
  transform: "translateY(-1px)",
  borderColor: "rgba(246,225,174,0.46)",
  boxShadow:
    "0 18px 46px rgba(216,181,106,0.22), 0 0 0 3px rgba(216,181,106,0.20)",
};

const badgeRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const badgeStyle = {
  display: "inline-flex",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(216,181,106,0.055)",
  border: "1px solid rgba(216,181,106,0.18)",
  color: "rgba(231,204,145,0.92)",
  fontSize: "13px",
  fontWeight: 800,
};

const statusBadgeStyle = {
  ...badgeStyle,
  background: "rgba(246,243,235,0.035)",
  border: "1px solid rgba(246,243,235,0.08)",
  color: "rgba(216,181,106,0.72)",
};
