import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { assertAccountNotDeleting } from "../../lib/account-deletion";
import { supabase as serviceSupabase } from "../../lib/pro";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await assertAccountNotDeleting(serviceSupabase, userId, process.env);

    const rawId = req.body?.id;
    let generationId = null;

    if (typeof rawId === "number" && Number.isSafeInteger(rawId) && rawId > 0) {
      generationId = String(rawId);
    } else if (typeof rawId === "string" && /^\d{1,19}$/.test(rawId)) {
      const parsedId = BigInt(rawId);
      if (parsedId > 0n && parsedId <= 9223372036854775807n) {
        generationId = parsedId.toString();
      }
    }

    if (generationId === null) {
      return res.status(400).json({ error: "Invalid generation id" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", generationId)
      .eq("user_id", userId);

    if (error) {
      console.error("DELETE_GENERATION_DATABASE_ERROR");
      return res.status(500).json({ error: "Delete failed" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error?.safeCode === "ACCOUNT_DELETION_IN_PROGRESS") {
      return res.status(410).json({ error: error.safeCode });
    }
    if (typeof error?.safeCode === "string" && error.safeCode.startsWith("ACCOUNT_DELETION_")) {
      return res.status(503).json({ error: error.safeCode });
    }
    console.error("DELETE_GENERATION_REQUEST_ERROR");
    return res.status(500).json({ error: "Delete failed" });
  }
}
