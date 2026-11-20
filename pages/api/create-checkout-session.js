export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  return res.status(403).json({ error: "MARKET_NOT_ACTIVATED" });
}
