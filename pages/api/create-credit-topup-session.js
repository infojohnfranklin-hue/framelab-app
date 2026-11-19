import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";
import { getEffectiveUserPlan, getStripeCustomerIdStrict, isProPlan, saveStripeCustomerId, supabase } from "../../lib/pro";
import { readCreditBalance } from "../../lib/credit-balance";
import { getStripePublishableKey, stripeSecretMatchesEnvironment } from "../../lib/stripe-mode";
import { assertAccountNotDeleting } from "../../lib/account-deletion";
import { createServerFinalizedPrepaymentDraft } from "../../lib/server-finalized-prepayment";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "AUTH_REQUIRED" });
    await assertAccountNotDeleting(supabase, userId, process.env);
    if (!stripeSecretMatchesEnvironment(process.env)) return res.status(503).json({ error: "STRIPE_MODE_MISMATCH" });
    const publishableKey = getStripePublishableKey(process.env);
    if (!publishableKey) return res.status(503).json({ error: "STRIPE_PUBLISHABLE_KEY_UNAVAILABLE" });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const draft = await createServerFinalizedPrepaymentDraft({
      serviceType: "credit_topup",
      userId,
      requestBody: req.body || {},
      env: process.env,
      supabase,
      stripe,
      getPlan: getEffectiveUserPlan,
      isProPlan,
      getBalance: (id) => readCreditBalance(supabase, id),
      getCustomerId: getStripeCustomerIdStrict,
      createCustomer: (id) => stripe.customers.create({ metadata: { clerkUserId: id } }, {
        idempotencyKey: `premivate-customer-${id}`,
      }),
      saveCustomerId: saveStripeCustomerId,
    });
    return res.status(200).json({ ...draft, publishableKey });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const code = typeof error?.safeCode === "string" ? error.safeCode : "TOPUP_DRAFT_FAILED";
    if (status >= 500) console.error("Top-up prepayment draft failed", { code });
    return res.status(status).json({ error: code });
  }
}
