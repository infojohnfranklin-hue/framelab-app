import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { pruneLocalContentCopies } from "../lib/browser-content-retention";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getUiCopy,
  getUiText,
  isSupportedLanguage,
} from "../data/languages";
import "../styles/premium.css";

function PlanStatusController({ onPlanStatus }) {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    let active = true;
    onPlanStatus(null, false);

    if (!isLoaded || !isSignedIn || !user?.id) {
      return () => {
        active = false;
      };
    }

    async function loadPlan() {
      try {
        const res = await fetch(`/api/me-plan?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          throw new Error("Plan status request failed");
        }

        const data = await res.json();
        const plan =
          typeof data.plan === "string" && data.plan ? data.plan : null;

        if (active) {
          onPlanStatus(plan, plan !== null);
        }
      } catch {
        if (active) {
          onPlanStatus(null, false);
        }
      }
    }

    loadPlan();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, onPlanStatus]);

  return null;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState(null);
  const [planStatusLoaded, setPlanStatusLoaded] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  const handlePlanStatus = useCallback((plan, loaded) => {
    setUserPlan(plan);
    setPlanStatusLoaded(loaded);
  }, []);

  useEffect(() => {
    pruneLocalContentCopies();
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
      <PlanStatusController onPlanStatus={handlePlanStatus} />
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
            border: "1px solid rgba(var(--premivate-gold-rgb),0.18)",
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
                background: "var(--premivate-gold-primary)",
                color: "#17130C",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </SignedOut>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              userProfileProps={{
                appearance: {
                  variables: {
                    colorPrimary: "rgb(var(--premivate-gold-rgb))",
                    colorPrimaryForeground: "#17130C",
                    colorBackground: "#0a0a0a",
                    colorForeground: "#ffffff",
                    colorMuted: "#141414",
                    colorMutedForeground: "rgba(255,255,255,0.62)",
                    colorNeutral: "#cfc7b8",
                    colorBorder: "rgba(var(--premivate-gold-rgb),0.28)",
                    colorRing: "rgb(var(--premivate-gold-rgb))",
                    colorShadow: "#000000",
                    borderRadius: "16px",
                  },
                },
              }}
              appearance={{
                variables: {
                  colorPrimary: "rgb(var(--premivate-gold-rgb))",
                  colorPrimaryForeground: "#17130C",
                  colorBackground: "#0a0a0a",
                  colorForeground: "#ffffff",
                  colorMuted: "#141414",
                  colorMutedForeground: "rgba(255,255,255,0.62)",
                  colorNeutral: "#cfc7b8",
                  colorBorder: "rgba(var(--premivate-gold-rgb),0.28)",
                  colorRing: "rgb(var(--premivate-gold-rgb))",
                  colorShadow: "#000000",
                  borderRadius: "16px",
                },
                elements: {
                  userButtonPopoverActionButton: {
                    color: "#f5f1e8",
                    borderRadius: "10px",
                    "&:hover, &:focus": {
                      backgroundColor: "rgba(var(--premivate-gold-rgb),0.12)",
                      color: "#ffffff",
                    },
                  },
                },
              }}
            />
          </SignedIn>
        </div>
        <div className="desktop-sidebar">
          <Sidebar
            userPlan={userPlan}
            planStatusLoaded={planStatusLoaded}
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
            userPlan={userPlan}
            planStatusLoaded={planStatusLoaded}
          />
          <footer
            className="premivate-legal-footer"
            aria-label={language === "Deutsch" ? "Rechtliche Informationen" : language === "Français" ? "Informations juridiques" : "Legal information"}
          >
            <span>{language === "Deutsch" ? "Rechtliches" : language === "Français" ? "Juridique" : "Legal"}</span>
            <Link href={language === "Deutsch" ? "/terms?lang=de" : language === "Français" ? "/terms?lang=fr" : "/terms"}>
              {language === "Deutsch" ? "AGB" : language === "Français" ? "Conditions" : "Terms"}
            </Link>
            <Link href={language === "Deutsch" ? "/privacy?lang=de" : language === "Français" ? "/privacy?lang=fr" : "/privacy"}>
              {language === "Deutsch" ? "Datenschutz" : language === "Français" ? "Confidentialité" : "Privacy"}
            </Link>
            <Link href={language === "Deutsch" ? "/imprint?lang=de" : language === "Français" ? "/imprint?lang=fr" : "/imprint"}>
              {language === "Deutsch" ? "Impressum" : language === "Français" ? "Mentions légales" : "Imprint"}
            </Link>
          </footer>
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

        .premivate-legal-footer {
          box-sizing: border-box;
          width: min(100%, 1464px);
          margin: 0 auto;
          padding: 18px 72px 26px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 18px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 12px;
          letter-spacing: 0.02em;
        }

        .premivate-legal-footer a {
          color: rgba(255, 255, 255, 0.64);
          text-decoration: none;
          transition: color 160ms ease;
        }

        .premivate-legal-footer a:hover,
        .premivate-legal-footer a:focus-visible {
          color: rgb(var(--premivate-gold-rgb));
        }

        @media (max-width: 900px) {
          .premivate-legal-footer {
            padding: 16px 20px 24px;
            gap: 14px;
          }

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
