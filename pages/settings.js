export default function SettingsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 34%), #050505",
        color: "white",
        padding: "72px 72px 120px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "980px" }}>
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
          FrameLab Settings
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
          Your creative workspace settings.
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.68)",
            fontSize: "19px",
            lineHeight: 1.6,
            maxWidth: "720px",
            marginBottom: "42px",
          }}
        >
          Manage your FrameLab workspace, project identity and premium generation preferences.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "22px",
          }}
        >
          <section style={cardStyle}>
            <h2 style={cardTitle}>Subscription</h2>
            <p style={cardText}>Current plan status is shown in the sidebar.</p>
            <div style={badgeStyle}>Pro Unlimited Active</div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitle}>Active Project</h2>
            <p style={cardText}>Your current workspace project name.</p>
            <div style={badgeStyle}>Untitled Project</div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitle}>Generation Safety</h2>
            <p style={cardText}>
              Paid generation tests should only be started after explicit approval.
            </p>
            <div style={badgeStyle}>Credit-safe workflow</div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitle}>Restore Status</h2>
            <p style={cardText}>
              FrameLab is currently running from the restored safe visual branch.
            </p>
            <div style={badgeStyle}>Restore safe</div>
          </section>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "28px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
};

const cardTitle = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: 800,
};

const cardText = {
  margin: "0 0 22px",
  color: "rgba(255,255,255,0.62)",
  lineHeight: 1.55,
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
