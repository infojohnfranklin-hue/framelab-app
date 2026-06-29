import Link from "next/link";

export default function DashboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.24), transparent 34%), #050505",
        color: "white",
        padding: "72px 72px 120px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1080px" }}>
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
          FrameLab Dashboard
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
          Your cinematic command center.
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
          Continue generating premium reel concepts, cinematic blueprints and saved creative systems from one clean workspace.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "22px",
            marginBottom: "34px",
          }}
        >
          <DashboardCard
            title="Generate Reel"
            text="Create a premium creative package for your music."
            href="/"
            button="Open Generate"
          />

          <DashboardCard
            title="Blueprints"
            text="Build director-grade cinematic AI video systems."
            href="/videos"
            button="Open Blueprints"
          />

          <DashboardCard
            title="History"
            text="Reopen, export and manage saved FrameLab generations."
            href="/history"
            button="Open History"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "22px",
          }}
        >
          <section style={wideCardStyle}>
            <h2 style={cardTitle}>Current Workspace</h2>
            <p style={cardText}>
              Active Project: <strong style={{ color: "white" }}>Untitled Project</strong>
            </p>
            <div style={badgeStyle}>Pro Unlimited Active</div>
          </section>

          <section style={wideCardStyle}>
            <h2 style={cardTitle}>Restore Status</h2>
            <p style={cardText}>
              FrameLab is running from the restored safe visual branch.
            </p>
            <div style={badgeStyle}>Safe restore active</div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, text, href, button }) {
  return (
    <section style={cardStyle}>
      <h2 style={cardTitle}>{title}</h2>
      <p style={cardText}>{text}</p>

      <Link
        href={href}
        style={{
          display: "inline-flex",
          padding: "13px 18px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)",
          color: "white",
          textDecoration: "none",
          fontWeight: 900,
          fontSize: "13px",
          boxShadow: "0 18px 50px rgba(124,58,237,0.32)",
        }}
      >
        {button}
      </Link>
    </section>
  );
}

const cardStyle = {
  padding: "28px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
  minHeight: "210px",
};

const wideCardStyle = {
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
  margin: "0 0 24px",
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
