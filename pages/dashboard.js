import Link from "next/link";

export default function DashboardPage({ ui, t }) {
  const _t = typeof t === "function" ? t : (value) => value;
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg, rgba(7,7,8,0.94) 0%, rgba(7,7,8,0.80) 40%, rgba(7,7,8,0.54) 72%, rgba(7,7,8,0.46) 100%), linear-gradient(180deg, rgba(9,8,6,0.18) 0%, rgba(9,8,6,0.36) 58%, rgba(9,8,6,0.78) 100%), url('/framelab-premium-dashboard-assets/01 — Dashboard Command Center Background.png'), #090A0C",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
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
            color: "#D8B56A",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "28px",
          }}
        >
          {_t("FrameLab Dashboard")}
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
          {ui.dashboard.headline}
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
          {_t("Continue generating premium reel concepts, cinematic blueprints and saved creative systems from one clean workspace.")}
        </p>

        <div
            className="dashboard-primary-grid"
          style={{
            display: "grid",
            gap: "22px",
            marginBottom: "34px",
          }}
        >
          <DashboardCard
            title={_t("Generate Reel")}
            text={_t("Create a premium creative package for your music.")}
            href="/"
            button={ui.dashboard.generateButton}
            image="/framelab-premium-dashboard-assets/01_Dashboard_Card_CinematicStage_Figure.png"
          />

          <DashboardCard
            title={_t("Blueprints")}
            text={_t("Build director-grade cinematic AI video systems.")}
            href="/videos"
            button={_t("Open Blueprints")}
            image="/framelab-premium-dashboard-assets/02_Dashboard_Card_CreativeMonitorWall.png"
          />

          <DashboardCard
            title={_t("History")}
            text={_t("Reopen, export and manage saved FrameLab generations.")}
            href="/history"
            button={_t("Open History")}
            image="/framelab-premium-dashboard-assets/06_History_Cinematic_Memory_Archive_FilmFrames.png"
          />
        </div>

        <div
            className="dashboard-secondary-grid"
          style={{
            display: "grid",
            gap: "22px",
          }}
        >
          <section
            className="dashboard-secondary-card"
            style={wideCardStyle}
          >
            <h2 style={cardTitle}>{ui.dashboard.workspaceTitle}</h2>
            <p style={cardText}>
              {ui.dashboard.activeProjectLabel}:{" "}
              <strong style={{ color: "white" }}>{_t("Untitled Project")}</strong>
            </p>
            <div style={badgeStyle}>{_t("Pro Unlimited Active")}</div>
          </section>

          <section
            className="dashboard-secondary-card"
            style={wideCardStyle}
          >
            <h2 style={cardTitle}>{_t("Restore Status")}</h2>
            <p style={cardText}>
              {ui.dashboard.restoreDescription}
            </p>
            <div style={badgeStyle}>{ui.dashboard.restoreSafe}</div>
          </section>
        </div>
      </div>

        <style jsx>{`
          .dashboard-primary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .dashboard-secondary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          @media (max-width: 1180px) {
            .dashboard-primary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .dashboard-secondary-grid {
              grid-template-columns: minmax(0, 1fr);
            }

            .dashboard-primary-card {
              min-height: 196px !important;
              padding: 24px !important;
            }

            .dashboard-primary-cta {
              min-width: 148px;
              justify-content: center;
              box-sizing: border-box;
            }

            .dashboard-secondary-card {
              padding: 24px !important;
            }
          }

          @media (max-width: 760px) {
            .dashboard-primary-grid {
              grid-template-columns: minmax(0, 1fr);
            }

            .dashboard-primary-card {
              min-height: 188px !important;
            }

            .dashboard-primary-cta {
              min-width: 0;
            }
          }
        `}</style>
</div>
  );
}

function DashboardCard({ title, text, href, button, image }) {
  return (
    <section
      className="dashboard-primary-card"
      style={{
        ...cardStyle,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        backgroundImage: `linear-gradient(180deg, rgba(12,12,12,0.48) 0%, rgba(12,12,12,0.72) 58%, rgba(12,12,12,0.90) 100%), url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h2 style={cardTitle}>{title}</h2>
      <p style={cardText}>{text}</p>

      <Link
        href={href}
        className="dashboard-primary-cta"
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          marginTop: "auto",
          padding: "13px 18px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, #B88A3B 0%, #E7CC91 100%)",
          color: "#17130C",
          textDecoration: "none",
          fontWeight: 900,
          fontSize: "13px",
          boxShadow: "0 18px 50px rgba(216,181,106,0.22)",
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
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(216,181,106,0.16)",
  color: "#E7CC91",
  fontSize: "13px",
  fontWeight: 800,
};
