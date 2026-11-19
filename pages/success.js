import { useEffect, useState } from "react";

function hex(bytes) {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

export default function Success({ ui, t }) {
  const _t = typeof t === "function" ? t : (value) => value;
  const [message, setMessage] = useState("Preparing your contract confirmation… / Vertragsbestätigung wird vorbereitet …");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const localized = (locale, en, de, fr) => locale === "de" ? de : locale === "fr" ? fr : en;

    async function pollProAccess(locale) {
      for (let attempt = 0; attempt < 30 && !cancelled; attempt += 1) {
        try {
          const response = await fetch(`/api/me-plan?ts=${Date.now()}`, { cache: "no-store" });
          const data = response.ok ? await response.json() : null;
          if (data?.plan === "pro") {
            window.location.replace("/");
            return true;
          }
        } catch { /* retry while Stripe and the signed webhook converge */ }
        await sleep(1000);
      }
      if (!cancelled) setMessage(localized(locale,
        "Your confirmation was transferred. Pro access is still being synchronized; refresh this page shortly.",
        "Deine Bestätigung wurde übertragen. Der Pro-Zugang wird noch synchronisiert; aktualisiere diese Seite gleich nochmals.",
        "Votre confirmation a été transférée. L’accès Pro est en cours de synchronisation ; actualisez cette page dans un instant."));
      return false;
    }

    async function runConfirmation(referenceId, referenceType) {
      const lookup = referenceType === "confirmation"
        ? `confirmation_id=${encodeURIComponent(referenceId)}`
        : `session_id=${encodeURIComponent(referenceId)}`;
      const referenceBody = referenceType === "confirmation"
        ? { confirmationId: referenceId }
        : { sessionId: referenceId };
      let confirmation = null;
      for (let attempt = 0; attempt < 60 && !cancelled; attempt += 1) {
        const response = await fetch(`/api/contract-confirmation?${lookup}&ts=${Date.now()}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          confirmation = data.confirmation;
          if (confirmation?.payment_status === "paid") break;
        } else if (response.status !== 404 && response.status !== 503) {
          throw new Error("CONTRACT_CONFIRMATION_LOOKUP_FAILED");
        }
        await sleep(1000);
      }
      if (cancelled) return;
      if (!confirmation || confirmation.payment_status !== "paid") {
        throw new Error("PAYMENT_CONFIRMATION_PENDING");
      }

      const locale = confirmation.terms_locale || "en";
      if (!confirmation.pdf_transfer_completed_at) {
        setMessage(localized(locale,
          "Transferring your complete, personalized contract confirmation…",
          "Deine vollständige, personalisierte Vertragsbestätigung wird übertragen …",
          "Transfert de votre confirmation de contrat complète et personnalisée…"));
        const pdfResponse = await fetch("/api/contract-confirmation-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(referenceBody),
          cache: "no-store",
        });
        if (!pdfResponse.ok) throw new Error("CONTRACT_PDF_TRANSFER_FAILED");
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const expectedLength = Number(pdfResponse.headers.get("X-Contract-Confirmation-Bytes"));
        const expectedHash = pdfResponse.headers.get("X-Contract-Confirmation-SHA256");
        if (pdfBuffer.byteLength !== expectedLength || !expectedHash ||
            new TextDecoder().decode(pdfBuffer.slice(0, 5)) !== "%PDF-") {
          throw new Error("CONTRACT_PDF_INTEGRITY_FAILED");
        }
        const digest = hex(await window.crypto.subtle.digest("SHA-256", pdfBuffer));
        if (digest !== expectedHash) throw new Error("CONTRACT_PDF_INTEGRITY_FAILED");

        const blobUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: "application/pdf" }));
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = `premivate-contract-${confirmation.service_type}.pdf`;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        const transferResponse = await fetch("/api/contract-confirmation-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...referenceBody, sha256: digest, byteLength: pdfBuffer.byteLength }),
          cache: "no-store",
        });
        const transferData = await transferResponse.json().catch(() => ({}));
        if (!transferResponse.ok) throw new Error(transferData.error || "CONTRACT_TRANSFER_REPORT_FAILED");
        confirmation = {
          ...confirmation,
          pdf_transfer_completed_at: new Date().toISOString(),
          state: transferData.state || (transferData.status === "service_eligible" ? "service_eligible" : "transfer_reported"),
          service_start_at: transferData.serviceStartAt || confirmation.service_start_at,
        };
      }

      if (cancelled) return;
      if (confirmation.state === "refund_review") {
        setMessage(localized(locale,
          "Your confirmation was transferred. A payment refund is under review, so the paid service is temporarily unavailable.",
          "Deine Vertragsbestätigung wurde übertragen. Eine Zahlungsrückerstattung wird geprüft; der bezahlte Dienst ist bis dahin gesperrt.",
          "Votre confirmation a été transférée. Un remboursement est en cours d’examen ; le service payant est temporairement indisponible."));
        return;
      }
      const serviceStart = Date.parse(confirmation.service_start_at || "");
      if (Number.isFinite(serviceStart) && serviceStart > Date.now()) {
        if (locale === "fr") {
          setMessage(`Votre confirmation de contrat a été transférée. Le service payant sera disponible le ${new Date(serviceStart).toLocaleString("fr-CH")}.`);
        } else {
          setMessage(localized(locale,
            `The contract confirmation was transferred. The paid service becomes available on ${new Date(serviceStart).toLocaleString("en-CH")} .`,
            `Die Vertragsbestätigung wurde übertragen. Der bezahlte Dienst wird am ${new Date(serviceStart).toLocaleString("de-CH")} nutzbar.`,
            ""));
        }
        return;
      }

      if (confirmation.service_type === "pro") {
        await pollProAccess(locale);
      } else {
        setMessage(localized(locale,
          "Your contract confirmation was transferred and your purchased credits are available.",
          "Deine Vertragsbestätigung wurde übertragen und die gekauften Credits sind verfügbar.",
          "Votre confirmation de contrat a été transférée et vos crédits achetés sont disponibles."));
        window.setTimeout(() => {
          if (!cancelled) window.location.replace("/settings");
        }, 1400);
      }
    }

    async function waitForLegacyPlan() {
      for (let attempt = 0; attempt < 20 && !cancelled; attempt += 1) {
        try {
          const response = await fetch(`/api/me-plan?ts=${Date.now()}`, { cache: "no-store" });
          const data = response.ok ? await response.json() : null;
          if (data?.plan === "pro") {
            window.location.replace("/");
            return;
          }
        } catch { /* retry */ }
        await sleep(500);
      }
      if (!cancelled) window.location.replace("/");
    }

    const params = new URLSearchParams(window.location.search);
    const confirmationId = params.get("confirmation_id");
    const sessionId = params.get("session_id");
    if (confirmationId || sessionId) {
      runConfirmation(confirmationId || sessionId, confirmationId ? "confirmation" : "session").catch((caught) => {
        if (!cancelled) {
          setError(caught?.message || "CONTRACT_CONFIRMATION_FAILED");
          setMessage("The confirmation is not complete yet. You can retry from Settings. / Die Bestätigung ist noch nicht abgeschlossen. Du kannst es in den Einstellungen erneut versuchen. / La confirmation n’est pas encore terminée. Vous pouvez réessayer dans les paramètres.");
        }
      });
    } else {
      waitForLegacyPlan();
    }
    return () => { cancelled = true; };
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#05030a",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "Inter, sans-serif",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 720 }}>
        <h1>{ui?.success?.title || _t("PREMIVATE")}</h1>
        <p aria-live="polite">{message}</p>
        {error && <p role="alert" style={{ color: "#f0b7a8" }}>{error}</p>}
        {error && <p><a href="/settings" style={{ color: "#efc16c" }}>Open Settings / Einstellungen öffnen / Ouvrir les paramètres</a></p>}
      </div>
    </main>
  );
}
