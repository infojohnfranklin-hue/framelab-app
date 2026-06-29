import Link from "next/link";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
  const [userPlan, setUserPlan] = useState("free");

useEffect(() => {
  async function loadPlan() {
    try {
      const res = await fetch(`/api/me-plan?ts=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const data = await res.json();

      setUserPlan(data.plan || "free");
    } catch (error) {
      console.error(error);
    }
  }

  loadPlan();
}, []);

  const router = useRouter();

  const mobileNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "📊",
    },
    {
      label: "Generate",
      href: "/",
      icon: "✨",
    },
    {
      label: "Videos",
      href: "/videos",
      icon: "🎬",
    },
    {
      label: "History",
      href: "/history",
      icon: "🕘",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: "⚙️",
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#050505",
          color: "white",
          overflowX: "hidden",
          width: "100%",
        }}
      >
        {/* Desktop Sidebar */}
        <div className="desktop-sidebar">
<Sidebar userPlan={userPlan} />
        </div>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
            boxSizing: "border-box",
            padding: "24px",
            paddingBottom: "120px",
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const active = router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                minWidth: "64px",
                textDecoration: "none",
                color: active ? "#ffffff" : "#777",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: active ? "600" : "400",
                transition: "0.2s ease",
                padding: "6px 4px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  marginBottom: "4px",
                }}
              >
                {item.icon}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .desktop-sidebar {
          display: block;
        }

        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 900px) {
          .desktop-sidebar {
            display: none;
          }

          .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 78px;
            background: #0b0b0b;
            border-top: 1px solid #1f1f1f;
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 9999;
            padding-bottom: env(safe-area-inset-bottom);
            overflow-x: auto;
            gap: 8px;
          }

          main {
            padding: 16px !important;
            padding-bottom: 120px !important;
          }
        }
      `}</style>
    </>
  );
}