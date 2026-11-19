import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { getEffectiveUserPlan, isProPlan, supabase } from "../../lib/pro";
import { readCreditBalance } from "../../lib/credit-balance";
import { stripeSecretMatchesEnvironment } from "../../lib/stripe-mode";
import { assertAccountNotDeleting } from "../../lib/account-deletion";
import { finalizeServerPrepayment } from "../../lib/server-finalized-prepayment";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
    await assertAccountNotDeleting(supabase, userId, process.env);
    if (!stripeSecretMatchesEnvironment(process.env)) return res.status(503).json({ error: "STRIPE_MODE_MISMATCH" });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const value = req.headers?.["x-vercel-ip-country"];
    const ipCountry = typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
    const result = await finalizeServerPrepayment({
      stripe,
      supabase,
      userId,
      confirmationId: req.body?.confirmationId,
      confirmationTokenId: req.body?.confirmationTokenId,
      ipCountry,
      env: process.env,
      getPlan: getEffectiveUserPlan,
      isProPlan,
      getBalance: (id) => readCreditBalance(supabase, id),
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const code = typeof error?.safeCode === "string" ? error.safeCode : "PREPAYMENT_FINALIZATION_FAILED";
    if (status >= 500) console.error("Prepayment finalization failed", { code });
    return res.status(status).json({ error: code });
  }
}
