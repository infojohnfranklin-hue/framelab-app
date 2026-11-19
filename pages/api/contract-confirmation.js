import { getAuth } from "@clerk/nextjs/server";
import { listContractConfirmationsForUser, getContractConfirmationForUser, getContractConfirmationByIdForUser } from "../../lib/contract-confirmation";
import { supabase } from "../../lib/pro";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });

  try {
    if (req.method === "GET") {
      const sessionId = typeof req.query?.session_id === "string" ? req.query.session_id : "";
      const confirmationId = typeof req.query?.confirmation_id === "string" ? req.query.confirmation_id : "";
      if (sessionId) {
        const confirmation = await getContractConfirmationForUser(supabase, userId, sessionId);
        if (!confirmation) return res.status(404).json({ error: "CONTRACT_CONFIRMATION_NOT_FOUND" });
        return res.status(200).json({ confirmation });
      }
      if (confirmationId) {
        const confirmation = await getContractConfirmationByIdForUser(supabase, userId, confirmationId);
        if (!confirmation) return res.status(404).json({ error: "CONTRACT_CONFIRMATION_NOT_FOUND" });
        return res.status(200).json({ confirmation });
      }
      const confirmations = await listContractConfirmationsForUser(supabase, userId);
      return res.status(200).json({ confirmations });
    }
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    console.error("Contract confirmation lookup failed", { code: error?.safeCode || "UNKNOWN" });
    return res.status(Number.isInteger(error?.status) ? error.status : 503)
      .json({ error: error?.safeCode || "CONTRACT_CONFIRMATION_LOOKUP_FAILED" });
  }
}
