import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { getStripeCustomerId, supabase } from "../../lib/pro";
import { getStripeBaseUrl, stripeSecretMatchesEnvironment } from "../../lib/stripe-mode";
import { assertAccountNotDeleting } from "../../lib/account-deletion";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "You must be logged in to manage your subscription",
      });
    }

    await assertAccountNotDeleting(supabase, userId, process.env);

    if (!stripeSecretMatchesEnvironment(process.env)) {
      return res.status(503).json({ error: "STRIPE_MODE_MISMATCH" });
    }
    const returnUrl = getStripeBaseUrl(process.env);
    if (!returnUrl) {
      return res.status(503).json({ error: "STRIPE_BASE_URL_UNAVAILABLE" });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const stripeCustomerId = await getStripeCustomerId(userId);

    if (!stripeCustomerId) {
      return res.status(404).json({
        error: "Stripe customer not found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    if (error?.safeCode === "ACCOUNT_DELETION_IN_PROGRESS") {
      return res.status(410).json({ error: error.safeCode });
    }
    if (typeof error?.safeCode === "string" && error.safeCode.startsWith("ACCOUNT_DELETION_")) {
      return res.status(503).json({ error: error.safeCode });
    }
    console.error("create-portal-session failed");

    return res.status(500).json({
      error: "Failed to create billing portal session",
    });
  }
}
