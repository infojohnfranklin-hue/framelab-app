import { createClient } from "@supabase/supabase-js";

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

export async function isPro(userId) {
  const plan = await getUserPlan(userId);
  return plan === "pro";
}

export async function isStandard(userId) {
  const plan = await getUserPlan(userId);
  return plan === "standard";
}