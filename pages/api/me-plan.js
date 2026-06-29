import { getAuth } from "@clerk/nextjs/server";
import { getUserPlan } from "../../lib/pro";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(200).json({
        plan: "free",
      });
    }

    // OWNER OVERRIDE
    if (userId === "user_3DrEzh71zs0gCqttVokYBfwF6Jk") {
      return res.status(200).json({
        plan: "pro",
      });
    }

    const plan = await getUserPlan(userId);

    return res.status(200).json({
      plan: plan || "free",
    });
  } catch (error) {
    console.error("me-plan error:", error);

    return res.status(500).json({
      error: "Failed to load plan",
    });
  }
}