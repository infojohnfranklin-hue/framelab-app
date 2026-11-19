import { finalizeDueTopupConfirmationsForUser } from "./contract-confirmation";

export function isCreditLedgerEnabled(env = process.env) {
  return env.PREMIVATE_CREDIT_LEDGER_BALANCE_ENABLED === "true" &&
    env.PREMIVATE_PRO_CREDIT_LEDGER_ENABLED === "true" &&
    env.PREMIVATE_PRO_TEXT_BLUEPRINT_CREDIT_LEDGER_ENABLED === "true";
}

export function parseCreditBalance(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("CREDIT_BALANCE_INVALID");
  }
  const fields = [
    "subscriptionAvailable",
    "subscriptionHeld",
    "purchasedAvailable",
    "purchasedHeld",
  ];
  for (const field of fields) {
    if (!Number.isSafeInteger(data[field]) || data[field] < 0) {
      throw new TypeError("CREDIT_BALANCE_INVALID");
    }
  }
  if (data.subscriptionAvailable + data.subscriptionHeld > 200) {
    throw new TypeError("CREDIT_BALANCE_INVALID");
  }
  const totalAvailable = data.subscriptionAvailable + data.purchasedAvailable;
  if (!Number.isSafeInteger(totalAvailable) ||
      !Number.isSafeInteger(data.purchasedAvailable + data.purchasedHeld)) {
    throw new TypeError("CREDIT_BALANCE_INVALID");
  }
  return {
    subscriptionAvailable: data.subscriptionAvailable,
    subscriptionHeld: data.subscriptionHeld,
    purchasedAvailable: data.purchasedAvailable,
    purchasedHeld: data.purchasedHeld,
    totalAvailable,
    creditAccessBlocked: data.creditAccessBlocked === true,
  };
}

export async function readCreditBalance(supabase, userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new TypeError("CREDIT_BALANCE_USER_INVALID");
  }
  await finalizeDueTopupConfirmationsForUser(supabase, userId);
  const { data, error } = await supabase.rpc("premivate_credit_get_balance", {
    p_clerk_user_id: userId,
  });
  if (error) throw error;
  return parseCreditBalance(data);
}
