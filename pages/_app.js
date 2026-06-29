import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import "../styles/premium.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState("free");

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/me-plan?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        const data = await res.json();
        setUserPlan(data.plan || "free");
      } catch (error) {
        console.error("Failed to load user plan:", error);
        setUserPlan("free");
      }
    }

    loadPlan();
  }, []);

  const mobileNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Generate", href: "/", icon: "✨" },
    { label: "Blueprints", href: "/videos", icon: "🎬" },
    { label: "History", href: "/history", icon: "🕘" },
    { label: "Exports", href: "/exports", icon: "📦" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <ClerkProvider>
      <div
        className="framelab-app-shell"
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          background: "#050505",
          color: "white",
          overflowX: "hidden",
        }}
      >
        <div className="desktop-sidebar">
          <Sidebar userPlan={userPlan} />
        </div>

        <main
          className="framelab-main-content"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: "100vh",
            background: "#050505",
          }}
        >
          <Component {...pageProps} />
        </main>
      </div>

      <nav className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const isActive = router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                minWidth: "58px",
                textDecoration: "none",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.48)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: isActive ? "800" : "600",
                transition: "0.2s ease",
                padding: "6px 4px",
              }}
            >
              <span
                style={{
                  fontSize: "19px",
                  marginBottom: "4px",
                  filter: isActive
                    ? "drop-shadow(0 0 12px rgba(168,85,247,0.65))"
                    : "none",
                }}
              >
                {item.icon}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        .desktop-sidebar {
          display: block;
          flex: 0 0 auto;
        }

        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 900px) {
          .framelab-app-shell {
            display: block !important;
          }

          .desktop-sidebar {
            display: none !important;
          }

          .framelab-main-content {
            width: 100% !important;
            min-height: 100vh !important;
            padding-bottom: 108px !important;
          }

          .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 78px;
            background: rgba(8, 8, 15, 0.96);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.52);
            backdrop-filter: blur(18px);
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 9999;
            padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
            overflow-x: auto;
            gap: 4px;
          }
        }
      `}</style>
    </ClerkProvider>
  );
}
