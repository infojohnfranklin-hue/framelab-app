import { getAuth } from "@clerk/nextjs/server";
import {
  FREE_CREDIT_LIMIT,
  getCreditSnapshot,
} from "../../lib/credits";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(200).json({
        used: 0,
        reserved: 0,
        remaining: FREE_CREDIT_LIMIT,
      });
    }

    const snapshot = await getCreditSnapshot(userId);

    return res.status(200).json(snapshot);
  } catch (error) {
    console.error("credits error:", error);

    return res.status(500).json({
      error: "Failed to load credits",
    });
  }
}
