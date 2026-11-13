import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { getEffectiveUserPlan, getStripeCustomerIdStrict, isProPlan, supabase } from "../../lib/pro";
import { readCreditBalance } from "../../lib/credit-balance";
import { createCreditTopupCheckout } from "../../lib/credit-topup";
import { getStripeBaseUrl } from "../../lib/stripe-mode";
import { assertAccountNotDeleting } from "../../lib/account-deletion";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });
  try {
    const { userId } = getAuth(req);
    if (userId) await assertAccountNotDeleting(supabase, userId, process.env);
    const result = await createCreditTopupCheckout({
      env: process.env,
      userId,
      packageId: req.body?.packageId,
      getPlan: getEffectiveUserPlan,
      isProPlan,
      getBalance: (id) => readCreditBalance(supabase, id),
      getCustomerId: getStripeCustomerIdStrict,
      supabase,
      baseUrl: getStripeBaseUrl(process.env),
      createSession: (params) => {
        // Stripe is initialized only after the flag, Pro status and balance pass.
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        return stripe.checkout.sessions.create(params);
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({ error: error?.safeCode || "TOPUP_CHECKOUT_FAILED" });
  }
}
