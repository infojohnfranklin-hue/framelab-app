import { getAuth } from "@clerk/nextjs/server";
import { getContractConfirmationForUser, getContractConfirmationByIdForUser, recordPdfTransfer } from "../../lib/contract-confirmation";
import { supabase } from "../../lib/pro";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
  const { sha256, byteLength } = req.body || {};
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  const confirmationId = typeof req.body?.confirmationId === "string" ? req.body.confirmationId : "";
  if (Boolean(sessionId) === Boolean(confirmationId) ||
      typeof sha256 !== "string" || !/^[a-f0-9]{64}$/.test(sha256) ||
      !Number.isSafeInteger(byteLength) || byteLength <= 0) {
    return res.status(400).json({ error: "CONTRACT_TRANSFER_REPORT_INVALID" });
  }

  try {
    const confirmation = confirmationId
      ? await getContractConfirmationByIdForUser(supabase, userId, confirmationId)
      : await getContractConfirmationForUser(supabase, userId, sessionId);
    if (!confirmation) return res.status(404).json({ error: "CONTRACT_CONFIRMATION_NOT_FOUND" });
    const result = await recordPdfTransfer(supabase, {
      confirmationId: confirmation.id,
      userId,
      sha256,
      byteLength,
    });
    return res.status(200).json({ confirmationId: confirmation.id, ...result });
  } catch (error) {
    console.error("Contract PDF transfer report failed", { code: error?.safeCode || "UNKNOWN" });
    return res.status(Number.isInteger(error?.status) ? error.status : 503)
      .json({ error: error?.safeCode || "CONTRACT_CONFIRMATION_TRANSFER_FAILED" });
  }
}
