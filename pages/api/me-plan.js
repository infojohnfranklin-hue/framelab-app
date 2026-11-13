import { getAuth } from "@clerk/nextjs/server";
import { getEffectiveUserPlan } from "../../lib/pro";
import { assertAccountNotDeleting } from "../../lib/account-deletion";
import { supabase } from "../../lib/pro";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(200).json({
        plan: "free",
      });
    }

    await assertAccountNotDeleting(supabase, userId, process.env);

    const plan = await getEffectiveUserPlan(userId);

    return res.status(200).json({
      plan: plan || "free",
    });
  } catch (error) {
    if (error?.safeCode === "ACCOUNT_DELETION_IN_PROGRESS") {
      return res.status(410).json({ error: error.safeCode });
    }
    if (typeof error?.safeCode === "string" && error.safeCode.startsWith("ACCOUNT_DELETION_")) {
      return res.status(503).json({ error: error.safeCode });
    }
    console.error("me-plan error:", error);

    return res.status(500).json({
      error: "Failed to load plan",
    });
  }
}
