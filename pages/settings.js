import { LANGUAGES } from "../data/languages";

export default function SettingsPage({
  language,
  setLanguage,
  ui,
  t = (value) => value,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg, rgba(7,7,8,0.94) 0%, rgba(7,7,8,0.80) 40%, rgba(7,7,8,0.54) 72%, rgba(7,7,8,0.46) 100%), linear-gradient(180deg, rgba(9,8,6,0.18) 0%, rgba(9,8,6,0.36) 58%, rgba(9,8,6,0.78) 100%), url('/framelab-premium-Settings-assets/ChatGPT Image 24. Sept. 2026, 14_52_09.png'), #090A0C",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        color: "rgba(246,243,235,0.96)",
        padding: "72px 72px 120px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "980px" }}>
        <div
          style={{
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#D8B56A",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "28px",
          }}
        >
          {t("FrameLab Settings")}
        </div>

        <h1
          style={{
            fontSize: "72px",
            lineHeight: "0.95",
            margin: "0 0 28px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            maxWidth: "900px",
            textShadow: "0 16px 48px rgba(0,0,0,0.34)",
          }}
        >
          {ui.settings.headline}
        </h1>

        <p
          style={{
            color: "rgba(246,243,235,0.68)",
            fontSize: "19px",
            lineHeight: 1.6,
            maxWidth: "720px",
            marginBottom: "42px",
          }}
        >
          {ui.settings.intro}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "22px",
          }}
        >
          <section style={{ ...cardStyle, ...primaryControlCardStyle }}>
            <h2 style={cardTitle}>🌐 {ui.settings.languageTitle}</h2>
            <p style={cardText}>{ui.settings.languageDescription}</p>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={ui.settings.languageTitle}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "14px",
                border: "1px solid rgba(216,181,106,0.22)",
                background: "rgba(0,0,0,0.34)",
                color: "rgba(246,243,235,0.96)",
                fontSize: "14px",
                fontWeight: 700,
                outline: "none",
              }}
            >
              {LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </section>

          <section style={{ ...cardStyle, ...contextCardStyle }}>
            <h2 style={cardTitle}>{t("Subscription")}</h2>
            <p style={cardText}>{t("Current plan status is shown in the sidebar.")}</p>
            <div style={badgeStyle}>{t("Pro Unlimited Active")}</div>
          </section>

          <section style={{ ...cardStyle, ...contextCardStyle }}>
            <h2 style={cardTitle}>{t("Active Project")}</h2>
            <p style={cardText}>{t("Your current workspace project name.")}</p>
            <div style={badgeStyle}>{t("Untitled Project")}</div>
          </section>

          <section style={{ ...cardStyle, ...statusCardStyle }}>
            <h2 style={cardTitle}>{ui.settings.generationSafetyTitle}</h2>
            <p style={cardText}>
              {ui.settings.generationSafetyDescription}
            </p>
            <div style={badgeStyle}>{ui.settings.creditSafeWorkflow}</div>
          </section>

          <section style={{ ...cardStyle, ...statusCardStyle }}>
            <h2 style={cardTitle}>{t("Restore Status")}</h2>
            <p style={cardText}>
              {ui.settings.restoreDescription}
            </p>
            <div style={badgeStyle}>{ui.settings.restoreSafe}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "28px",
  borderRadius: "24px",
  background: "rgba(12,12,13,0.76)",
  border: "1px solid rgba(246,243,235,0.08)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.30)",
  backdropFilter: "blur(8px)",
};

const primaryControlCardStyle = {
  background:
    "linear-gradient(145deg, rgba(42,35,22,0.92) 0%, rgba(17,16,14,0.90) 72%)",
  border: "1px solid rgba(216,181,106,0.34)",
  boxShadow:
    "0 28px 86px rgba(0,0,0,0.38), inset 0 0 0 1px rgba(246,225,174,0.025)",
};

const contextCardStyle = {
  background: "rgba(13,13,14,0.82)",
  border: "1px solid rgba(246,243,235,0.09)",
};

const statusCardStyle = {
  background: "rgba(10,10,11,0.70)",
  border: "1px solid rgba(246,243,235,0.065)",
  boxShadow: "0 18px 56px rgba(0,0,0,0.22)",
};

const cardTitle = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: 800,
};

const cardText = {
  margin: "0 0 22px",
  color: "rgba(246,243,235,0.62)",
  lineHeight: 1.55,
};

const badgeStyle = {
  display: "inline-flex",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(216,181,106,0.16)",
  color: "#E7CC91",
  fontSize: "13px",
  fontWeight: 800,
};
