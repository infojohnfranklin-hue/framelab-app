import { getAuth } from "@clerk/nextjs/server";
import { supabase } from "../../lib/pro";
import { assertAccountNotDeleting } from "../../lib/account-deletion";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store");

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await assertAccountNotDeleting(supabase, userId, process.env);

    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !Array.isArray(data)) {
      console.error("HISTORY_DATABASE_ERROR");
      return res.status(500).json({ error: "History could not be loaded" });
    }

    return res.status(200).json({ success: true, generations: data });
  } catch (error) {
    if (error?.safeCode === "ACCOUNT_DELETION_IN_PROGRESS") {
      return res.status(410).json({ error: error.safeCode });
    }
    if (typeof error?.safeCode === "string" && error.safeCode.startsWith("ACCOUNT_DELETION_")) {
      return res.status(503).json({ error: error.safeCode });
    }
    console.error("HISTORY_REQUEST_ERROR");
    return res.status(500).json({ error: "History could not be loaded" });
  }
}
