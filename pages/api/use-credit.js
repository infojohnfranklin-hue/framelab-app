import { getAuth } from "@clerk/nextjs/server";
import { increaseFreeUses } from "../../lib/credits";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    const identifier =
      userId ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "guest";

// await increaseFreeUses(identifier);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to increase credits",
    });
  }
}