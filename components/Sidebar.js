import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

export default function Sidebar({
  userPlan,
  language,
  ui,
  t = (value) => value,
}) {
  const router = useRouter();
  const [activeProject, setActiveProject] = useState("Untitled Project");

  useEffect(() => {
    const savedProject = localStorage.getItem("framelabActiveProject");

    if (savedProject) {
      setActiveProject(savedProject);
    }
  }, []);

  const menuItems = [
    { label: t("Dashboard"), href: "/dashboard" },
    { label: t("Generate"), href: "/" },
    { label: t("Blueprints"), href: "/videos" },
    { label: t("History"), href: "/history" },
    { label: t("Exports"), href: "/exports" },
    { label: t("Settings"), href: "/settings" },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        width: "240px",
        height: "100vh",
        background: "linear-gradient(180deg, #141517 0%, #0A0B0D 100%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "18px 14px",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          margin: "4px 0 24px",
        }}
      >
        <Link href="/">
          <img
            src="/videos/logo/framelab-logo.png"
            alt="FrameLab"
            style={{
              width: "200px",
              display: "block",
              margin: "0 auto",
              filter: "drop-shadow(0 0 18px rgba(216,181,106,0.14))",
              cursor: "pointer",
              transition: "0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.035)";
              e.currentTarget.style.filter =
                "drop-shadow(0 0 28px rgba(216,181,106,0.24))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter =
                "drop-shadow(0 0 18px rgba(216,181,106,0.14))";
            }}
          />
        </Link>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "9px",
        }}
      >
        {menuItems.map((item) => {
          const isActive = router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #B88A3B 0%, #E7CC91 100%)"
                    : "rgba(255,255,255,0.045)",
                  border: isActive
                    ? "1px solid rgba(216,181,106,0.32)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: "white",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  transition: "0.28s ease",
                  boxShadow: isActive
                    ? "0 12px 34px rgba(216,181,106,0.24)"
                    : "0 0 0 rgba(0,0,0,0)",
                  transform: "translateX(0px)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateX(6px)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                    e.currentTarget.style.border =
                      "1px solid rgba(216,181,106,0.14)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 28px rgba(216,181,106,0.07)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateX(0px)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.045)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 rgba(0,0,0,0)";
                  }
                }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          marginTop: "14px",
          padding: "12px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "999px",
            background: "#4ade80",
            boxShadow: "0 0 18px rgba(74,222,128,0.7)",
            flex: "0 0 auto",
          }}
        />

        <div>
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "2px",
              color: "rgba(255,255,255,0.45)",
              marginBottom: "4px",
            }}
          >
            ACTIVE PROJECT
          </div>

          <div
            style={{
              fontWeight: "800",
              color: "white",
              fontSize: "14px",
            }}
          >
            {activeProject === "Untitled Project" ? t("Untitled Project") : activeProject}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "relative",
          flex: "1 1 0",
          minHeight: 0,
          overflow: "hidden",
          pointerEvents: "none",
          background: "#0A0B0D",
        }}
      >
        <img
          src="/framelab-premium-Sidebar-assets/Creative_Reflection_Studio.png"
          alt=""
          draggable="false"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 72%",
            opacity: 0.48,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, #0A0B0D 0%, rgba(10,11,13,0.94) 22%, rgba(10,11,13,0.44) 52%, rgba(10,11,13,0.16) 76%, #0A0B0D 100%)",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "16px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(216,181,106,0.16)",
          boxShadow: "0 0 40px rgba(216,181,106,0.06)",
        }}
      >
        <p
          style={{
            color: "white",
            fontWeight: "800",
            margin: "0 0 10px",
            fontSize: "15px",
          }}
        >
          {t("Upgrade to Pro")}
        </p>

        <p
          style={{
            color: "#E7CC91",
            fontSize: "14px",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          Unlimited cinematic AI reel generations.
        </p>

        <button
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #B88A3B 0%, #E7CC91 100%)",
            color: "#17130C",
            fontWeight: "800",
            cursor: "pointer",
            transition: "0.3s ease",
            boxShadow: "0 10px 30px rgba(216,181,106,0.20)",
          }}
          onClick={() => {
            if (userPlan === "pro") {
              alert(t("You already have Pro Unlimited."));
              return;
            }

            window.location.href = "/pricing";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 18px 40px rgba(216,181,106,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(216,181,106,0.20)";
          }}
        >
          {userPlan === "pro" ? "Pro Unlimited Active" : "Go Pro"}
        </button>
      </div>
    </aside>
  );
}
