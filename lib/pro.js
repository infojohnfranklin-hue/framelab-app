import { createClient } from "@supabase/supabase-js";
import { isContractConfirmationServiceEligible } from "./contract-confirmation";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function activatePlan(
  userId,
  plan,
  stripeCustomerId = null
) {
  const updateData = {
    id: userId,
    plan,
  };

  if (stripeCustomerId) {
    updateData.stripe_customer_id = stripeCustomerId;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(updateData);

  if (error) {
    console.error("Supabase activatePlan error:", error);
    throw error;
  }

  return true;
}

export const PREMIVATE_OWNER_USER_ID = "user_3DrEzh71zs0gCqttVokYBfwF6Jk";

export function isPremivateOwner(userId) {
  return typeof userId === "string" && userId === PREMIVATE_OWNER_USER_ID;
}

export async function getEffectiveUserPlan(userId) {
  if (!userId) return null;
  if (isPremivateOwner(userId)) return "pro";
  const { data, error } = await supabase
    .from("profiles")
    .select("plan,stripe_subscription_id,stripe_subscription_status,stripe_paid_through,stripe_contract_confirmation_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase getEffectiveUserPlan error:", error);
    throw error;
  }
  if (!data) return "free";

  if (data.stripe_contract_confirmation_id) {
    const eligible = await isContractConfirmationServiceEligible(
      supabase,
      data.stripe_contract_confirmation_id
    );
    if (!eligible) return "free";
  }

  // Preserve legacy Pro records until they have been associated with a
  // lifecycle-managed Stripe subscription. Once associated, access is tied to
  // the last successfully paid-through instant, including normal cancellation
  // and payment retry windows.
  if (data.stripe_subscription_id || data.stripe_subscription_status) {
    const paidThrough = Date.parse(data.stripe_paid_through || "");
    return Number.isFinite(paidThrough) && paidThrough > Date.now() ? "pro" : "free";
  }
  return data.plan || "free";
}

export function isProPlan(plan) {
  return (plan || "").toLowerCase().includes("pro");
}

export async function getUserPlan(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase getUserPlan error:", error);
    return "free";
  }

  return data?.plan || "free";
}

export async function getStripeCustomerId(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase getStripeCustomerId error:", error);
    return null;
  }

  return data?.stripe_customer_id || null;
}

export async function getStripeCustomerIdStrict(userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new TypeError("INVALID_CLERK_USER_ID");
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.stripe_customer_id || null;
}

export async function saveStripeCustomerId(userId, stripeCustomerId) {
  if (typeof userId !== "string" || !userId.trim() ||
      typeof stripeCustomerId !== "string" || !stripeCustomerId.trim()) {
    throw new TypeError("STRIPE_CUSTOMER_INPUT_INVALID");
  }
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, stripe_customer_id: stripeCustomerId });
  if (error) throw error;
}

export async function updateStripeSubscription(userId, update) {
  if (typeof userId !== "string" || !userId.trim() ||
      !update || typeof update.subscriptionId !== "string" || !update.subscriptionId ||
      typeof update.status !== "string" || typeof update.livemode !== "boolean") {
    throw new TypeError("STRIPE_SUBSCRIPTION_INPUT_INVALID");
  }

  const { data: current, error: readError } = await supabase
    .from("profiles")
    .select("stripe_subscription_id,stripe_paid_through")
    .eq("id", userId)
    .maybeSingle();
  if (readError) throw readError;

  if (current?.stripe_subscription_id &&
      current.stripe_subscription_id !== update.subscriptionId &&
      Date.parse(current.stripe_paid_through || "") > Date.now()) {
    throw new Error("STRIPE_SUBSCRIPTION_OWNERSHIP_CONFLICT");
  }

  const currentPaidThrough = Date.parse(current?.stripe_paid_through || "");
  let paidThrough = Number.isFinite(currentPaidThrough) ? currentPaidThrough : null;
  if (update.paidThrough) {
    const candidate = Date.parse(update.paidThrough);
    if (!Number.isFinite(candidate)) throw new TypeError("STRIPE_PAID_THROUGH_INVALID");
    paidThrough = paidThrough === null ? candidate : Math.max(paidThrough, candidate);
  }
  if (update.immediateEnd === true) paidThrough = Math.min(paidThrough ?? Date.now(), Date.now());

  const hasPaidAccess = paidThrough !== null && paidThrough > Date.now();
  const values = {
    id: userId,
    plan: hasPaidAccess ? "pro" : "free",
    stripe_subscription_id: update.subscriptionId,
    stripe_subscription_status: update.status,
    stripe_paid_through: paidThrough === null ? null : new Date(paidThrough).toISOString(),
    stripe_cancel_at_period_end: update.cancelAtPeriodEnd === true,
    stripe_livemode: update.livemode,
    stripe_status_updated_at: new Date().toISOString(),
    stripe_contract_confirmation_id: update.contractConfirmationId || null,
  };
  if (update.customerId) values.stripe_customer_id = update.customerId;

  const { error } = await supabase.from("profiles").upsert(values);
  if (error) throw error;
  return { plan: values.plan, paidThrough: values.stripe_paid_through };
}

export async function isPro(userId) {
  const plan = await getUserPlan(userId);
  return (plan || "").toLowerCase().includes("pro");
}

export async function isStandard(userId) {
  const plan = await getUserPlan(userId);
  return plan === "standard";
}
