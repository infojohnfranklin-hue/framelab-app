import { getFreeUses } from "../lib/credits";

export default async function handler(req, res) {
  try {
    const identifier =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "guest";

    const used = await getFreeUses(identifier);

    return res.status(200).json({
      used,
      remaining: Math.max(0, 2 - used),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load credits",
    });
  }
}