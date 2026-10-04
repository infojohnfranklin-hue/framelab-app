import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { getStripeCustomerId } from "../../lib/pro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    const stripeCustomerId = await getStripeCustomerId(userId);

    if (!stripeCustomerId) {
      return res.status(404).json({
        error: "Stripe customer not found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: process.env.NEXT_PUBLIC_BASE_URL,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error("create-portal-session error:", error);

    return res.status(500).json({
      error: "Failed to create billing portal session",
    });
  }
}
