export default function Sidebar() {
  return (
    <div style={{
      width: "260px",
      height: "100vh",
      background: "#0b0b10",
      color: "white",
      padding: "20px",
      position: "fixed",
      left: 0,
      top: 0,
      borderRight: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "30px" }}>
        FrameLab
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <a href="/" style={{ color: "white", textDecoration: "none" }}>Generate</a>
        <a href="/history" style={{ color: "white", textDecoration: "none" }}>History</a>
        <a href="/videos" style={{ color: "white", textDecoration: "none" }}>Blueprints</a>
        <a href="/settings" style={{ color: "white", textDecoration: "none" }}>Settings</a>
      </nav>
    </div>
  );
}
