import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Sidebar({ userPlan }) {
    const router = useRouter();
    const [activeProject, setActiveProject] = useState("Untitled Project");

useEffect(() => {
  const savedProject = localStorage.getItem(
    "framelabActiveProject"
  );

  if (savedProject) {
    setActiveProject(savedProject);
  }
}, []);


  const menuItems = [
    { label: "Generate", href: "/" },
    { label: "Blueprints", href: "/videos" },
    { label: "History", href: "/history" },
    { label: "Exports", href: "/exports" },
    { label: "Settings", href: "/settings" },
  ];

return (
  <div
    className="sidebar"
    style={{
              width: "300px",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b0b12 0%, #140f1f 100%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "30px 20px",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        style={{
          marginBottom: "40px",
          textAlign: "left",
        }}
      >
        <Link href="/">
          <img
            src="/videos/logo/framelab-logo.png"
            alt="FrameLab"
            style={{
              width: "260px",
              marginBottom: "24px",
              filter: "drop-shadow(0 0 18px rgba(168,85,247,0.25))",
              cursor: "pointer",
              transition: "0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.filter =
                "drop-shadow(0 0 28px rgba(168,85,247,0.45))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter =
                "drop-shadow(0 0 18px rgba(168,85,247,0.25))";
            }}
          />
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
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
                    ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                    : "rgba(255,255,255,0.04)",
                  border: isActive
                    ? "1px solid rgba(168,85,247,0.55)"
                    : "1px solid rgba(255,255,255,0.06)",
                  color: "white",
                  padding: "16px 18px",
                  borderRadius: "18px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                  transition: "0.28s ease",
                  boxShadow: isActive
                    ? "0 12px 34px rgba(124,58,237,0.42)"
                    : "0 0 0 rgba(124,58,237,0)",
                  transform: "translateX(0px)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform =
                      "translateX(6px)";
                    e.currentTarget.style.background =
                      "rgba(124,58,237,0.12)";
                    e.currentTarget.style.border =
                      "1px solid rgba(168,85,247,0.22)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 28px rgba(124,58,237,0.16)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform =
                      "translateX(0px)";
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255,255,255,0.06)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 rgba(124,58,237,0)";
                  }
                }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "34px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  }}
>
  <div
    style={{
      width: "12px",
      height: "12px",
      borderRadius: "999px",
      background: "#4ade80",
      boxShadow: "0 0 18px rgba(74,222,128,0.7)",
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
      {activeProject}
    </div>
  </div>
</div>
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          borderRadius: "22px",
          background: "rgba(124,58,237,0.12)",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 0 40px rgba(124,58,237,0.12)",
        }}
      >
        <p
          style={{
            color: "white",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Upgrade to Pro
        </p>

        <p
          style={{
            color: "#c4b5fd",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          Unlimited cinematic AI reel generations.
        </p>

<button
  style={{
    marginTop: "16px",
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background:
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    transition: "0.3s ease",
    boxShadow:
      "0 10px 30px rgba(124,58,237,0.25)",
  }}
  onClick={() => {
    if (userPlan === "pro") {
      alert("You already have Pro Unlimited.");
      return;
    }

    window.location.href = "/pricing";
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "0 18px 40px rgba(124,58,237,0.42)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0px)";
    e.currentTarget.style.boxShadow =
      "0 10px 30px rgba(124,58,237,0.25)";
  }}
>
  {userPlan === "pro" ? "Pro Unlimited Active" : "Go Pro"}
</button>
      </div>
    </div>
  );
}