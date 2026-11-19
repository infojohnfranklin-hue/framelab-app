import { getAuth } from "@clerk/nextjs/server";
import { createOrReadConfirmationPdf, getContractConfirmationForUser, getContractConfirmationByIdForUser } from "../../lib/contract-confirmation";
import { supabase } from "../../lib/pro";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  const confirmationId = typeof req.body?.confirmationId === "string" ? req.body.confirmationId : "";
  if (Boolean(sessionId) === Boolean(confirmationId)) return res.status(400).json({ error: "CONTRACT_CONFIRMATION_REFERENCE_REQUIRED" });

  try {
    const confirmation = confirmationId
      ? await getContractConfirmationByIdForUser(supabase, userId, confirmationId)
      : await getContractConfirmationForUser(supabase, userId, sessionId);
    if (!confirmation) return res.status(404).json({ error: "CONTRACT_CONFIRMATION_NOT_FOUND" });
    const result = await createOrReadConfirmationPdf(supabase, confirmation.id, userId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(result.bytes.length));
    res.setHeader("Content-Disposition", `attachment; filename="premivate-contract-${result.row.service_type}.pdf"`);
    res.setHeader("X-Contract-Confirmation-SHA256", result.row.pdf_sha256);
    res.setHeader("X-Contract-Confirmation-Bytes", String(result.row.pdf_byte_length));
    return res.status(200).send(result.bytes);
  } catch (error) {
    console.error("Contract PDF delivery failed", { code: error?.safeCode || "UNKNOWN" });
    return res.status(Number.isInteger(error?.status) ? error.status : 503)
      .json({ error: error?.safeCode || "CONTRACT_CONFIRMATION_PDF_FAILED" });
  }
}
