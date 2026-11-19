import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { stripeSecretMatchesEnvironment } from "../../lib/stripe-mode";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
    if (!stripeSecretMatchesEnvironment(process.env)) {
      return res.status(503).json({ error: "STRIPE_MODE_MISMATCH" });
    }
    const sessionId = req.body?.sessionId;
    if (typeof sessionId !== "string" || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
      return res.status(400).json({ error: "CHECKOUT_SESSION_ID_INVALID" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.id !== sessionId ||
        session.metadata?.clerkUserId !== userId ||
        session.client_reference_id !== userId ||
        session.metadata?.premivateCheckoutFlow !== "r1-location-v1" ||
        session.ui_mode !== "elements" ||
        session.livemode !== (process.env.VERCEL_ENV === "production")) {
      return res.status(403).json({ error: "CHECKOUT_SESSION_INVALID" });
    }
    if (session.status !== "open") {
      return res.status(200).json({ status: session.status });
    }
    const expired = await stripe.checkout.sessions.expire(sessionId);
    if (!expired || expired.id !== sessionId || expired.status !== "expired") {
      return res.status(503).json({ error: "CHECKOUT_SESSION_EXPIRATION_UNCONFIRMED" });
    }
    return res.status(200).json({ status: "expired" });
  } catch (error) {
    console.error("Checkout Session expiration failed", {
      code: typeof error?.code === "string" ? error.code : "CHECKOUT_SESSION_EXPIRATION_FAILED",
    });
    return res.status(500).json({ error: "CHECKOUT_SESSION_EXPIRATION_FAILED" });
  }
}
