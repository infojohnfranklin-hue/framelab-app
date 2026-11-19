export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  return res.status(410).json({ error: "LEGACY_CLIENT_FINALIZED_CHECKOUT_DISABLED" });
}
