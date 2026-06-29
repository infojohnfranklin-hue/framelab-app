import Link from "next/link";

export default function ExportsPage() {
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
          FrameLab Exports
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
          Export-ready creative packages.
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
          Export your saved reel concepts, cinematic prompts, director notes and creative systems from FrameLab History.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "22px",
            marginBottom: "34px",
          }}
        >
          <section style={cardStyle}>
            <h2 style={cardTitle}>Project Exports</h2>
            <p style={cardText}>
              Open History to export saved FrameLab generations and creative packages.
            </p>

            <Link href="/history" style={buttonStyle}>
              Open History
            </Link>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitle}>Export Types</h2>
            <p style={cardText}>
              FrameLab exports are designed for AI video prompts, captions, hooks, director notes and production-ready creative direction.
            </p>

            <div style={badgeRow}>
              <span style={badgeStyle}>AI Video Prompt</span>
              <span style={badgeStyle}>Captions</span>
              <span style={badgeStyle}>Hooks</span>
              <span style={badgeStyle}>Director Notes</span>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitle}>Current Status</h2>
            <p style={cardText}>
              Export tools are connected to saved generations inside the cinematic memory system.
            </p>

            <div style={badgeStyle}>History linked</div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitle}>Restore Status</h2>
            <p style={cardText}>
              Exports page has been restored as part of the safe premium navigation system.
            </p>

            <div style={badgeStyle}>Safe restore active</div>
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
  margin: "0 0 24px",
  color: "rgba(255,255,255,0.62)",
  lineHeight: 1.55,
};

const buttonStyle = {
  display: "inline-flex",
  padding: "13px 18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "13px",
  boxShadow: "0 18px 50px rgba(124,58,237,0.32)",
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
  background: "rgba(168,85,247,0.18)",
  border: "1px solid rgba(168,85,247,0.28)",
  color: "#f5d0fe",
  fontSize: "13px",
  fontWeight: 800,
};
