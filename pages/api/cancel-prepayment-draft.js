import { getAuth } from "@clerk/nextjs/server";
import { markContractConfirmationExpired } from "../../lib/contract-confirmation";
import { supabase } from "../../lib/pro";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
  const confirmationId = req.body?.confirmationId;
  if (typeof confirmationId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(confirmationId)) {
    return res.status(400).json({ error: "PREPAYMENT_DRAFT_ID_INVALID" });
  }
  try {
    await markContractConfirmationExpired(supabase, confirmationId, userId);
    return res.status(200).json({ status: "closed" });
  } catch (error) {
    return res.status(Number.isInteger(error?.status) ? error.status : 503)
      .json({ error: error?.safeCode || "PREPAYMENT_DRAFT_CLOSE_FAILED" });
  }
}
