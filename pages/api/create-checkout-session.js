import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { getStripeCustomerIdStrict, saveStripeCustomerId, supabase } from "../../lib/pro";
import { createProSubscriptionCheckout } from "../../lib/stripe-subscription";
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
        error: "You must be logged in to upgrade",
      });
    }

    await assertAccountNotDeleting(supabase, userId, process.env);

    if (!stripeSecretMatchesEnvironment(process.env)) {
      return res.status(503).json({ error: "STRIPE_MODE_MISMATCH" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const result = await createProSubscriptionCheckout({
      env: process.env,
      userId,
      stripe,
      supabase,
      getCustomerId: getStripeCustomerIdStrict,
      createCustomer: (id) => stripe.customers.create({
        metadata: { clerkUserId: id },
      }, { idempotencyKey: `premivate-customer-${id}` }),
      saveCustomerId: saveStripeCustomerId,
      baseUrl: getStripeBaseUrl(process.env),
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const code = error?.safeCode;
    console.error("Pro Checkout failed", { code: typeof code === "string" ? code : "CHECKOUT_FAILED" });
    return res.status(status).json({ error: typeof code === "string" ? code : "CHECKOUT_FAILED" });
  }
}
