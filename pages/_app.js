import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getUiCopy,
  getUiText,
  isSupportedLanguage,
} from "../data/languages";
import "../styles/premium.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState("free");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      setLanguage(savedLanguage);
    } else if (savedLanguage) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
    }
  }, []);

  const handleLanguageChange = useCallback((nextLanguage) => {
    const normalizedLanguage = isSupportedLanguage(nextLanguage)
      ? nextLanguage
      : DEFAULT_LANGUAGE;

    setLanguage(normalizedLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  }, []);

  const ui = getUiCopy(language);
  const t = useCallback(
    (value) => getUiText(language, value),
    [language]
  );

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
    {
      label: t("Dashboard"),
      href: "/dashboard",
      iconPath: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
    },
    {
      label: t("Generate"),
      href: "/",
      iconPath:
        "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z",
    },
    {
      label: t("Blueprints"),
      href: "/videos",
      iconPath: "M4 8h16v11H4z M4 8l3-4h4L8 8 M12 8l3-4h4l-3 4",
    },
    {
      label: t("History"),
      href: "/history",
      iconPath: "M4 12a8 8 0 1 0 2.3-5.7L4 8 M4 4v4h4 M12 8v5l3 2",
    },
    {
      label: t("Exports"),
      href: "/exports",
      iconPath: "M12 3v12 M8 7l4-4 4 4 M5 13v6h14v-6",
    },
    {
      label: t("Settings"),
      href: "/settings",
      iconPath:
        "M5 7h14 M8 5v4 M5 12h14 M15 10v4 M5 17h14 M10 15v4",
    },
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
        <div
          style={{
            position: "fixed",
            top: "30px",
            right: "30px",
            zIndex: 999,
            padding: "8px",
            borderRadius: "18px",
            background: "rgba(10, 11, 13, 0.72)",
            border: "1px solid rgba(216,181,106,0.18)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
            backdropFilter: "blur(14px)",
          }}
        >
          <SignedOut>
            <button
              onClick={() => (window.location.href = "/sign-in")}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "none",
                background: "#B88A3B",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
        <div className="desktop-sidebar">
          <Sidebar
            userPlan={userPlan}
            language={language}
            ui={ui}
            t={t}
          />
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
          <Component
            {...pageProps}
            language={language}
            setLanguage={handleLanguageChange}
            ui={ui}
            t={t}
          />
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
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  width: "20px",
                  height: "20px",
                  marginBottom: "5px",
                  overflow: "visible",
                  filter: isActive
                    ? "drop-shadow(0 0 12px rgba(168,85,247,0.65))"
                    : "none",
                }}
              >
                <path
                  d={item.iconPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

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
