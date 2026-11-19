import { LANGUAGES } from "../data/languages";
import { useEffect, useState } from "react";
import { SignedIn, useReverification } from "@clerk/nextjs";
import { clearLocalContentCopies } from "../lib/browser-content-retention";
import CheckoutTermsDialog from "../components/CheckoutTermsDialog";
import StripePrepaymentDialog from "../components/StripePrepaymentDialog";
import PendingContractConfirmations from "../components/PendingContractConfirmations";
import { hasAnyActivatedPrepaymentMarket } from "../lib/prepayment-eligibility";

export default function SettingsPage({
  language,
  setLanguage,
  ui,
  userPlan,
  planStatusLoaded,
  t = (value) => value,
}) {
  const [creditState, setCreditState] = useState(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [topupBusy, setTopupBusy] = useState("");
  const [topupError, setTopupError] = useState("");
  const [pendingTopupPackage, setPendingTopupPackage] = useState("");
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [earlyStartRequested, setEarlyStartRequested] = useState(false);
  const prepaymentMarketsOpen = hasAnyActivatedPrepaymentMarket();

  useEffect(() => {
    if (!planStatusLoaded || !["pro", "free"].includes(userPlan)) {
      setCreditState(null);
      return undefined;
    }
    let active = true;
    setCreditLoading(true);
    setCreditError("");
    fetch("/api/credits", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "CREDIT_BALANCE_UNAVAILABLE");
        return data;
      })
      .then((data) => { if (active) setCreditState(data); })
      .catch((error) => { if (active) setCreditError(error.message); })
      .finally(() => { if (active) setCreditLoading(false); });
    return () => { active = false; };
  }, [planStatusLoaded, userPlan]);

  function requestTopup(packageId) {
    if (!prepaymentMarketsOpen || topupBusy || creditState?.topupSalesEnabled !== true) return;
    setTermsAccepted(false);
    setEarlyStartRequested(false);
    setTopupError("");
    setPendingTopupPackage(packageId);
  }

  function cancelTopup() {
    setPendingTopupPackage("");
    setTermsAccepted(false);
    setEarlyStartRequested(false);
  }

  function cancelTopupPayment() {
    const confirmationId = checkoutSession?.confirmationId;
    setCheckoutSession(null);
    setTopupBusy("");
    if (confirmationId) {
      fetch("/api/cancel-prepayment-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationId }),
      }).catch(() => {});
    }
  }

  async function startTopup(disclosure = {}) {
    const packageId = pendingTopupPackage;
    if (!prepaymentMarketsOpen || !packageId || !termsAccepted || topupBusy || creditState?.topupSalesEnabled !== true) return;
    const requestEarlyStart = earlyStartRequested === true;
    setPendingTopupPackage("");
    setTermsAccepted(false);
    setEarlyStartRequested(false);
    setTopupBusy(packageId);
    setTopupError("");
    try {
      const response = await fetch("/api/create-credit-topup-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          termsAccepted: true,
          termsLocale: disclosure.termsLocale || (language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en"),
          earlyStartRequested: requestEarlyStart,
          marketCountryScope: disclosure.marketCountryScope,
          marketRegion: disclosure.marketRegion,
          buyerType: disclosure.buyerType,
          frenchVersionPresented: disclosure.frenchVersionPresented,
          alternativeLanguageChoice: disclosure.alternativeLanguageChoice,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.confirmationId || !data.amount || !data.currency || !data.publishableKey) {
        throw new Error(data.error || "TOPUP_CHECKOUT_FAILED");
      }
      setCheckoutSession(data);
    } catch (error) {
      setTopupError(error.message || "TOPUP_CHECKOUT_FAILED");
      setTopupBusy("");
    }
  }

  return (
    <div
      className="settings-page"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg, rgba(7,7,8,0.94) 0%, rgba(7,7,8,0.80) 40%, rgba(7,7,8,0.54) 72%, rgba(7,7,8,0.46) 100%), linear-gradient(180deg, rgba(9,8,6,0.18) 0%, rgba(9,8,6,0.36) 58%, rgba(9,8,6,0.78) 100%), url('/framelab-premium-Settings-assets/ChatGPT Image 24. Sept. 2026, 14_52_09.png'), #090A0C",
        backgroundSize: "100% 100%, 100% 100%, cover",
        backgroundPosition: "center, center, center center",
        backgroundRepeat: "no-repeat, no-repeat, no-repeat",
        backgroundAttachment: "fixed, fixed, fixed",
        color: "rgba(246,243,235,0.96)",
        padding: "72px 72px 120px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "980px" }}>
        <div
          style={{
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--premivate-gold-muted)",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "28px",
          }}
        >
          {t("Premivate Settings")}
        </div>

        <h1
          className="settings-page__headline"
          style={{
            fontSize: "72px",
            lineHeight: "0.95",
            margin: "0 0 28px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            maxWidth: "900px",
            textShadow: "0 16px 48px rgba(0,0,0,0.34)",
          }}
        >
          {ui.settings.headline}
        </h1>

        <p
          style={{
            color: "rgba(246,243,235,0.68)",
            fontSize: "19px",
            lineHeight: 1.6,
            maxWidth: "720px",
            marginBottom: "42px",
          }}
        >
          {ui.settings.intro}
        </p>

        <div
          className="settings-page__grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "22px",
          }}
        >
          <section style={{ ...cardStyle, ...primaryControlCardStyle }}>
            <h2 style={cardTitle}>🌐 {ui.settings.languageTitle}</h2>
            <p style={cardText}>{ui.settings.languageDescription}</p>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={ui.settings.languageTitle}
              style={{
                marginTop: "auto",
                width: "100%",
                padding: "12px 14px",
                borderRadius: "14px",
                border: "1px solid rgba(var(--premivate-gold-rgb),0.22)",
                background: "rgba(0,0,0,0.34)",
                color: "rgba(246,243,235,0.96)",
                fontSize: "14px",
                fontWeight: 700,
                outline: "none",
              }}
            >
              {LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </section>

          <section style={{ ...cardStyle, ...contextCardStyle }}>
            <h2 style={cardTitle}>{t("Subscription")}</h2>
            <p style={cardText}>{t("Current plan status is shown in the sidebar.")}</p>
            <SignedIn>
              {planStatusLoaded && userPlan === "pro" ? (
                <div style={badgeStyle}>{t("Pro Active")}</div>
              ) : planStatusLoaded && userPlan === "free" ? (
                <div style={badgeStyle}>{t("Free plan active")}</div>
              ) : null}
            </SignedIn>
          </section>

          <SignedIn>
            {planStatusLoaded && (
              userPlan === "pro" ||
              (userPlan === "free" && creditState?.ledgerEnabled && creditState.purchasedAvailable > 0)
            ) ? (
              <section style={{ ...cardStyle, ...contextCardStyle }}>
                <h2 style={cardTitle}>{ui.settings.creditsTitle}</h2>
                {creditLoading ? <p style={cardText}>{ui.settings.creditsLoading}</p> : null}
                {creditError ? <p role="alert" style={{ ...cardText, color: "#fca5a5" }}>{ui.settings.creditsUnavailable}</p> : null}
                {!creditLoading && !creditError && creditState?.creditAccessBlocked ? (
                  <p role="alert" style={{ ...cardText, color: "#fca5a5" }}>{ui.settings.creditAccountRestricted}</p>
                ) : null}
                {!creditLoading && !creditError && !creditState?.ledgerEnabled ? (
                  <p style={cardText}>{ui.settings.creditsNotActive}</p>
                ) : null}
                {!creditLoading && !creditError && creditState?.ledgerEnabled ? (
                  <>
                    <p style={cardText}>
                      {userPlan === "pro" ? <>{ui.settings.subscriptionCredits}: {creditState.subscriptionAvailable}<br /></> : null}
                      {ui.settings.purchasedCredits}: {creditState.purchasedAvailable}
                    </p>
                    {userPlan === "pro" ? (
                      <>
                        <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>{ui.settings.topupsTitle}</h3>
                        {prepaymentMarketsOpen && creditState.topupSalesEnabled && !creditState.creditAccessBlocked ? (
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button type="button" disabled={Boolean(topupBusy)} onClick={() => requestTopup("credits_25")} style={topupButtonStyle}>{topupBusy === "credits_25" ? ui.settings.creditsLoading : ui.settings.topup25}</button>
                            <button type="button" disabled={Boolean(topupBusy)} onClick={() => requestTopup("credits_50")} style={topupButtonStyle}>{topupBusy === "credits_50" ? ui.settings.creditsLoading : ui.settings.topup50}</button>
                          </div>
                        ) : <p style={cardText}>{ui.settings.topupsUnavailable}</p>}
                        {topupError ? <p role="alert" style={{ ...cardText, color: "#fca5a5", marginTop: "12px" }}>{ui.settings.checkoutFailed}</p> : null}
                      </>
                    ) : null}
                  </>
                ) : null}
              </section>
            ) : null}
          </SignedIn>

          <section style={{ ...cardStyle, ...contextCardStyle }}>
            <h2 style={cardTitle}>{t("Local Draft")}</h2>
            <p style={cardText}>{ui.settings.activeProjectDescription}</p>
            <div style={badgeStyle}>{t("Saved only in this browser")}</div>
          </section>

          <section style={{ ...cardStyle, ...statusCardStyle }}>
            <h2 style={cardTitle}>{ui.settings.generationSafetyTitle}</h2>
            <p style={cardText}>
              {ui.settings.generationSafetyDescription}
            </p>
            <div style={badgeStyle}>{ui.settings.creditSafeWorkflow}</div>
          </section>

          <section style={{ ...cardStyle, ...statusCardStyle }}>
            <h2 style={cardTitle}>{t("Restore Status")}</h2>
            <p style={cardText}>
              {ui.settings.restoreDescription}
            </p>
            <div style={badgeStyle}>{ui.settings.restoreSafe}</div>
          </section>

          <SignedIn>
            <AccountDeletionCard language={language} userPlan={userPlan} />
          </SignedIn>
        </div>
      </div>

      <CheckoutTermsDialog
        open={Boolean(pendingTopupPackage)}
        language={language || "English"}
        locale={language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en"}
        summary={
          pendingTopupPackage === "credits_25"
            ? ui.settings.topup25
            : pendingTopupPackage === "credits_50"
              ? ui.settings.topup50
              : ""
        }
        checked={termsAccepted}
        onCheckedChange={setTermsAccepted}
        serviceType="credit_topup"
        earlyStartRequested={earlyStartRequested}
        onEarlyStartRequestedChange={setEarlyStartRequested}
        onCancel={cancelTopup}
        onConfirm={startTopup}
        busy={Boolean(topupBusy)}
      />
      <StripePrepaymentDialog
        open={Boolean(checkoutSession)}
        session={checkoutSession}
        locale={language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en"}
        onCancel={cancelTopupPayment}
      />

      <SignedIn>
        <div style={{ maxWidth: "980px" }}>
          <PendingContractConfirmations language={language} />
        </div>
      </SignedIn>

      <style jsx global>{`
        @media (max-width: 760px) {
          .settings-page {
            padding: 56px 20px 120px !important;
          }

          .settings-page__headline {
            font-size: clamp(46px, 12vw, 58px) !important;
            line-height: 1.02 !important;
            max-width: 100% !important;
            overflow-wrap: anywhere;
          }

          .settings-page__grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}

function AccountDeletionCard({ language, userPlan }) {
  const german = language === "Deutsch";
  const [preflight, setPreflight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/account-deletion", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "ACCOUNT_DELETION_UNAVAILABLE");
        return data;
      })
      .then((data) => { if (active) setPreflight(data); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submitDeletion = useReverification(async () => {
    const response = await fetch("/api/account-deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: "DELETE", acknowledged: true }),
    });
    const data = await response.json().catch(() => ({}));
    if (data?.clerk_error) return data;
    if (!response.ok) {
      const error = new Error(data.error || "ACCOUNT_DELETION_INCOMPLETE");
      error.code = data.error;
      throw error;
    }
    return data;
  });

  async function confirmDeletion() {
    if (confirmation !== "DELETE" || !acknowledged || busy) return;
    setBusy(true);
    setDeleteError("");
    try {
      const result = await submitDeletion();
      if (result?.status === "deleted") {
        clearLocalContentCopies();
        window.location.replace("/sign-in?account-deleted=1");
        return;
      }
      if (result?.clerk_error) return;
      throw new Error("ACCOUNT_DELETION_INCOMPLETE");
    } catch (error) {
      setDeleteError(error?.code || error?.message || "ACCOUNT_DELETION_INCOMPLETE");
    } finally {
      setBusy(false);
    }
  }

  const balance = preflight?.balance || {};
  const credits = (
    <>
      {german ? "Abo-Credits" : "Subscription credits"}: {balance.subscriptionAvailable ?? "—"} {userPlan === "pro" ? (german ? "verfügbar" : "available") : userPlan === "free" ? (german ? "gespeichert, im Free-Tarif nicht nutzbar" : "stored, unavailable on Free plan") : (german ? "Tarifstatus nicht bestätigt" : "plan status unconfirmed")} ({balance.subscriptionHeld ?? 0} {german ? "reserviert" : "reserved"})<br />
      {german ? "Gekaufte Credits" : "Purchased credits"}: {balance.purchasedAvailable ?? "—"} {german ? "verfügbar" : "available"} ({balance.purchasedHeld ?? 0} {german ? "reserviert" : "reserved"})<br />
      {german ? "Free-Credits" : "Free credits"}: {balance.freeRemaining ?? "—"} {german ? "verfügbar" : "available"} ({balance.freeReserved ?? 0} {german ? "reserviert" : "reserved"})
    </>
  );
  const blockers = Array.isArray(preflight?.blockers) ? preflight.blockers : [];
  const cannotStart = preflight?.stage === "none" && blockers.length > 0;

  return (
    <section style={{ ...cardStyle, ...statusCardStyle, gridColumn: "1 / -1", borderColor: "rgba(248,113,113,0.28)" }}>
      <h2 style={cardTitle}>{german ? "Konto endgültig löschen" : "Permanently delete account"}</h2>
      <p style={cardText}>
        {german
          ? "Dadurch werden deine PREMIVATE-Identität, History, dein Profil und Guthabensdaten dauerhaft entfernt. Ungenutzte Abo- und gekaufte Credits verfallen grundsätzlich ohne automatische Rückerstattung; zwingende gesetzliche Ansprüche bleiben unberührt."
          : "This permanently removes your PREMIVATE identity, History, profile and credit records. Unused subscription and purchased credits generally expire without an automatic refund; mandatory legal rights remain unaffected."}
      </p>
      <p style={{ ...cardText, marginBottom: "12px" }}>
        {german
          ? "Lokale Entwürfe in diesem Browser sind nicht kontogebunden und werden nicht automatisch gelöscht. Externe Zahlungsbelege und gesetzlich erforderliche Aufbewahrungsdaten können erhalten bleiben."
          : "Local drafts in this browser are not linked to your account and are not removed automatically. External payment records and data required by law may be retained."}
      </p>
      <p style={{ ...cardText, marginBottom: "12px" }}>
        {german
          ? "Ein minimaler gehashter Sicherheitsmarker kann aufbewahrt werden, damit verspätete Systemereignisse gelöschte Kontodaten nicht wiederherstellen."
          : "A minimal hashed security marker may be retained to prevent delayed system events from restoring deleted account data."}
      </p>
      {loading ? <p style={cardText}>{german ? "Löschstatus wird geladen …" : "Loading deletion status…"}</p> : null}
      {!loading && loadError ? (
        <p role="alert" style={{ ...cardText, color: "#fca5a5" }}>
          {german ? "Der Kontolöschungsstatus ist derzeit nicht verfügbar. Bitte versuche es später erneut." : "Account deletion is currently unavailable. Please try again later."}
        </p>
      ) : null}
      {!loading && preflight?.enabled === false ? (
        <p role="alert" style={{ ...cardText, color: "#fca5a5" }}>
          {german ? "Die Kontolöschung ist derzeit nicht aktiviert. Wende dich an support@premivate.com." : "Account deletion is not currently enabled. Contact support@premivate.com."}
        </p>
      ) : null}
      {!loading && preflight?.enabled ? (
        <>
          <p style={{ ...cardText, marginBottom: "12px" }}>{credits}</p>
          {preflight.subscription?.status ? (
            <p style={{ ...cardText, marginBottom: "12px" }}>
              {german ? "Abo-Status" : "Subscription status"}: {preflight.subscription.status}
              {preflight.subscription.cancelAtPeriodEnd ? (german ? " · endet zum Periodenende" : " · ends at period end") : ""}
            </p>
          ) : null}
          {cannotStart ? (
            <p role="alert" style={{ ...cardText, color: "#fca5a5" }}>
              {german
                ? "Die Löschung kann noch nicht sicher abgeschlossen werden (laufender Vorgang, Checkout oder Finanzdatensatz in Prüfung). Bitte warte oder wende dich an support@premivate.com."
                : "Deletion cannot be completed safely yet (an operation, checkout, or financial record is still being reviewed). Please wait or contact support@premivate.com."}
            </p>
          ) : null}
          {preflight.stage !== "none" ? (
            <p role="status" style={cardText}>
              {german ? "Ein Löschvorgang ist bereits sicher gestartet. Bestätige erneut, um ihn fortzusetzen." : "A deletion is already safely in progress. Confirm again to continue it."}
            </p>
          ) : null}
          <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }} htmlFor="account-delete-confirmation">
            {german ? "Zur Bestätigung DELETE eingeben" : "Type DELETE to confirm"}
          </label>
          <input
            id="account-delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            style={{ ...deletionInputStyle, marginBottom: "14px" }}
          />
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "18px", color: "rgba(246,243,235,0.82)", lineHeight: 1.5 }}>
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} style={{ marginTop: "4px", accentColor: "rgb(var(--premivate-gold-rgb))" }} />
            <span>{german ? "Ich bestätige, dass ungenutzte Credits grundsätzlich verfallen und die Löschung endgültig ist." : "I understand that unused credits generally expire and that this deletion is permanent."}</span>
          </label>
          {deleteError ? <p role="alert" style={{ ...cardText, color: "#fca5a5" }}>{german ? "Löschung nicht abgeschlossen. Bitte prüfe den Status und versuche es erneut." : "Deletion was not completed. Check the status and try again."}</p> : null}
          <button type="button" disabled={busy || confirmation !== "DELETE" || !acknowledged || cannotStart} onClick={confirmDeletion} style={{ ...deletionButtonStyle, opacity: busy || confirmation !== "DELETE" || !acknowledged || cannotStart ? 0.55 : 1 }}>
            {busy ? (german ? "Sicheres Löschen läuft …" : "Deleting securely…") : (german ? "Mein Konto endgültig löschen" : "Permanently delete my account")}
          </button>
        </>
      ) : null}
    </section>
  );
}

const topupButtonStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
  background: "rgb(var(--premivate-gold-rgb))",
  color: "#17130C",
  fontWeight: 800,
  cursor: "pointer",
};

const cardStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "28px",
  borderRadius: "24px",
  background: "rgba(12,12,13,0.76)",
  border: "1px solid rgba(246,243,235,0.08)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.30)",
  backdropFilter: "blur(8px)",
};

const primaryControlCardStyle = {
  background:
    "linear-gradient(145deg, rgba(42,35,22,0.92) 0%, rgba(17,16,14,0.90) 72%)",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.34)",
  boxShadow:
    "0 28px 86px rgba(0,0,0,0.38), inset 0 0 0 1px rgba(246,225,174,0.025)",
};

const contextCardStyle = {
  background: "rgba(13,13,14,0.82)",
  border: "1px solid rgba(246,243,235,0.09)",
};

const statusCardStyle = {
  background: "rgba(10,10,11,0.70)",
  border: "1px solid rgba(246,243,235,0.065)",
  boxShadow: "0 18px 56px rgba(0,0,0,0.22)",
};

const cardTitle = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: 800,
};

const cardText = {
  margin: "0 0 22px",
  color: "rgba(246,243,235,0.62)",
  lineHeight: 1.55,
};

const badgeStyle = {
  alignSelf: "flex-start",
  display: "inline-flex",
  marginTop: "auto",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(var(--premivate-gold-rgb),0.16)",
  color: "var(--premivate-gold-muted)",
  fontSize: "13px",
  fontWeight: 800,
};

const deletionInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(246,243,235,0.2)",
  background: "rgba(0,0,0,0.35)",
  color: "rgba(246,243,235,0.96)",
  fontSize: "15px",
};

const deletionButtonStyle = {
  alignSelf: "flex-start",
  padding: "13px 18px",
  borderRadius: "12px",
  border: "1px solid rgba(248,113,113,0.45)",
  background: "rgba(127,29,29,0.75)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
