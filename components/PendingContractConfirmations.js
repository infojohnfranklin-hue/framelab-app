import { useEffect, useState } from "react";
import Link from "next/link";

export default function PendingContractConfirmations({ language }) {
  const [confirmations, setConfirmations] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = () => fetch("/api/contract-confirmation", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { confirmations: [] })
      .then((data) => {
        if (active && Array.isArray(data.confirmations)) setConfirmations(data.confirmations);
      })
      .catch(() => {});
    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const locale = language === "Deutsch" ? "de" : language === "Français" ? "fr" : "en";
  const isFrench = locale === "fr";
  const outstanding = confirmations.filter((item) =>
    item.payment_status === "paid" && !item.pdf_transfer_completed_at
  );
  const waiting = confirmations.filter((item) =>
    item.payment_status === "paid" && item.pdf_transfer_completed_at &&
    item.service_start_at && Date.parse(item.service_start_at) > Date.now()
  );
  const refundReview = confirmations.filter((item) => item.payment_status === "paid" && item.state === "refund_review");

  if (!outstanding.length && !waiting.length && !refundReview.length) return null;

  return (
    <section style={{
      marginTop: "24px",
      padding: "22px 24px",
      borderRadius: "18px",
      border: "1px solid rgba(var(--premivate-gold-rgb),0.28)",
      background: "rgba(0,0,0,0.28)",
      color: "rgba(246,243,235,0.92)",
    }} aria-live="polite">
      <h2 style={{ margin: "0 0 10px", fontSize: "19px" }}>
        {locale === "de" ? "Vertragsbestätigung" : isFrench ? "Confirmation du contrat" : "Contract confirmation"}
      </h2>
      {outstanding.map((item) => (
        <p key={item.id} style={{ lineHeight: 1.55, margin: "8px 0" }}>
          {locale === "de" ? "Bitte schliesse die Übertragung deiner Vertragsbestätigung ab:" : isFrench ? "Terminez le transfert de votre confirmation du contrat :" : "Complete the transfer of your contract confirmation:"}{" "}
          <Link href={`/success?confirmation_id=${encodeURIComponent(item.id)}`} style={{ color: "#efc16c", textDecoration: "underline" }}>
            {locale === "de" ? "Bestätigung jetzt übertragen" : isFrench ? "Transférer la confirmation" : "Transfer confirmation now"}
          </Link>
        </p>
      ))}
      {waiting.map((item) => (
        <p key={item.id} style={{ lineHeight: 1.55, margin: "8px 0" }}>
          {locale === "de"
            ? `Der bezahlte Dienst wird ab ${new Date(item.service_start_at).toLocaleString("de-CH")} nutzbar.`
            : isFrench
              ? `Le service payant sera disponible le ${new Date(item.service_start_at).toLocaleString("fr-CH")}.`
              : `The paid service becomes available on ${new Date(item.service_start_at).toLocaleString("en-CH")}.`}
        </p>
      ))}
      {refundReview.map((item) => (
        <p key={item.id} role="status" style={{ lineHeight: 1.55, margin: "8px 0" }}>
          {locale === "de"
            ? "Für diese Zahlung läuft eine Rückerstattungsprüfung. Der bezahlte Dienst bleibt bis zum Abschluss gesperrt."
            : isFrench
              ? "Un examen du remboursement est en cours pour ce paiement. Le service payant reste bloqué jusqu’à sa résolution."
              : "A refund review is open for this payment. The paid service remains locked until it is resolved."}
          {!item.pdf_transfer_completed_at ? (
              <> {locale === "de" ? "Die Vertragsbestätigung kann hier weiterhin übertragen werden:" : isFrench ? "Vous pouvez encore transférer la confirmation du contrat ici :" : "You can still transfer the contract confirmation here:"}{" "}
              <Link href={`/success?confirmation_id=${encodeURIComponent(item.id)}`} style={{ color: "#efc16c", textDecoration: "underline" }}>
                {locale === "de" ? "PDF übertragen" : isFrench ? "Transférer le PDF" : "Transfer PDF"}
              </Link>
            </>
          ) : null}
        </p>
      ))}
    </section>
  );
}
