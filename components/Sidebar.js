import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Sidebar({
  userPlan,
  planStatusLoaded,
  language,
  ui,
  t = (value) => value,
}) {
  const router = useRouter();
  const [activeProject, setActiveProject] = useState("Untitled Project");
  const [showAlreadyProDialog, setShowAlreadyProDialog] = useState(false);
  const alreadyProDialogRef = useRef(null);

  useEffect(() => {
    const savedProject = localStorage.getItem("framelabActiveProject");

    if (savedProject) {
      setActiveProject(savedProject);
    }
  }, []);

  useEffect(() => {
    if (!showAlreadyProDialog) {
      return;
    }

    const dialog = alreadyProDialogRef.current;

    if (!dialog) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [showAlreadyProDialog]);

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
            src="/videos/logo/premivate-logo.png"
            alt="PREMIVATE"
            style={{
              width: "200px",
              display: "block",
              margin: "0 auto",
              filter: "drop-shadow(0 0 18px rgba(var(--premivate-gold-rgb),0.14))",
              cursor: "pointer",
              transition: "0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.035)";
              e.currentTarget.style.filter =
                "drop-shadow(0 0 28px rgba(var(--premivate-gold-rgb),0.24))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter =
                "drop-shadow(0 0 18px rgba(var(--premivate-gold-rgb),0.14))";
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
                    ? "linear-gradient(135deg, var(--premivate-gold-primary) 0%, var(--premivate-gold-highlight) 100%)"
                    : "rgba(255,255,255,0.045)",
                  border: isActive
                    ? "1px solid rgba(var(--premivate-gold-rgb),0.32)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: isActive ? "#17130C" : "white",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  transition: "0.28s ease",
                  boxShadow: isActive
                    ? "0 12px 34px rgba(var(--premivate-gold-rgb),0.24)"
                    : "0 0 0 rgba(0,0,0,0)",
                  transform: "translateX(0px)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateX(6px)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                    e.currentTarget.style.border =
                      "1px solid rgba(var(--premivate-gold-rgb),0.14)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 28px rgba(var(--premivate-gold-rgb),0.07)";
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
          border: "1px solid rgba(var(--premivate-gold-rgb),0.16)",
          boxShadow: "0 0 40px rgba(var(--premivate-gold-rgb),0.06)",
        }}
      >
        <SignedIn>
          {planStatusLoaded && userPlan === "free" && (
            <p
              style={{
                color: "white",
                fontWeight: "800",
                margin: "0 0 10px",
                fontSize: "15px",
              }}
            >
              {t("Free plan active")}
            </p>
          )}
        </SignedIn>

        {planStatusLoaded && userPlan !== "pro" && (
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
        )}

        <p
          style={{
            color: "var(--premivate-gold-muted)",
            fontSize: "14px",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          {t("Premium cinematic AI reel concepts and creative direction.")}
        </p>

        <button
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, var(--premivate-gold-primary) 0%, var(--premivate-gold-highlight) 100%)",
            color: "#17130C",
            fontWeight: "800",
            cursor: "pointer",
            transition: "0.3s ease",
            boxShadow: "0 10px 30px rgba(var(--premivate-gold-rgb),0.20)",
          }}
          onClick={() => {
            if (planStatusLoaded && userPlan === "pro") {
              setShowAlreadyProDialog(true);
              return;
            }

            window.location.href = "/pricing";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 18px 40px rgba(var(--premivate-gold-rgb),0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(var(--premivate-gold-rgb),0.20)";
          }}
        >
          <SignedIn>
            {planStatusLoaded && userPlan === "pro"
              ? t("Pro Active")
              : t("Upgrade to Pro")}
          </SignedIn>
          <SignedOut>{t("Upgrade to Pro")}</SignedOut>
        </button>
      </div>

      <SignedIn>
        {showAlreadyProDialog &&
          planStatusLoaded &&
          userPlan === "pro" && (
        <dialog
          ref={alreadyProDialogRef}
          aria-labelledby="sidebar-already-pro-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            setShowAlreadyProDialog(false);
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }

            const bounds = event.currentTarget.getBoundingClientRect();

            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            ) {
              setShowAlreadyProDialog(false);
            }
          }}
          style={{
            width: "420px",
            maxWidth: "calc(100% - 44px)",
            boxSizing: "border-box",
            margin: "auto",
            padding: "28px 24px",
            background:
              "linear-gradient(180deg, rgba(20,21,23,0.98), rgba(9,10,12,0.98))",
            border: "1px solid rgba(var(--premivate-gold-rgb),0.18)",
            borderRadius: "24px",
            boxShadow: "0 30px 120px rgba(0,0,0,0.55)",
            color: "white",
            textAlign: "center",
            position: "fixed",
          }}
        >
          <style>{`
            dialog[aria-labelledby="sidebar-already-pro-dialog-title"]::backdrop {
              background: rgba(0, 0, 0, 0.75);
            }
          `}</style>

          <button
            type="button"
            autoFocus
            aria-label={t("Close")}
            onClick={() => setShowAlreadyProDialog(false)}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
              fontWeight: "900",
            }}
          >
            ×
          </button>

          <div
            style={{
              color: "var(--premivate-gold-muted)",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.12em",
              marginBottom: "14px",
            }}
          >
            PRO
          </div>

          <p
            id="sidebar-already-pro-dialog-title"
            style={{
              color: "white",
              fontSize: "17px",
              fontWeight: "600",
              lineHeight: "1.6",
              margin: "0",
              padding: "0 18px",
            }}
          >
            {t("Your Pro access is already active.")}
          </p>
        </dialog>
          )}
      </SignedIn>
    </aside>
  );
}
