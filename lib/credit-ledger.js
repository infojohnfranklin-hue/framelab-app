export const SUBSCRIPTION_CREDITS_PER_PAID_PERIOD = 100;
export const SUBSCRIPTION_CREDIT_CAP = 200;

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function calculateRollover(subscriptionAvailable, subscriptionHeld) {
  if (
    !Number.isSafeInteger(subscriptionAvailable) ||
    !Number.isSafeInteger(subscriptionHeld) ||
    subscriptionAvailable < 0 ||
    subscriptionHeld < 0 ||
    subscriptionAvailable + subscriptionHeld > SUBSCRIPTION_CREDIT_CAP
  ) {
    throw new TypeError("INVALID_SUBSCRIPTION_CREDIT_BALANCE");
  }

  const before = subscriptionAvailable + subscriptionHeld;
  const grant = Math.min(
    SUBSCRIPTION_CREDITS_PER_PAID_PERIOD,
    SUBSCRIPTION_CREDIT_CAP - before
  );

  return {
    availableBefore: subscriptionAvailable,
    heldBefore: subscriptionHeld,
    totalBefore: before,
    grant,
    availableAfter: subscriptionAvailable + grant,
    heldAfter: subscriptionHeld,
    totalAfter: before + grant,
  };
}

/**
 * Uses the user's latest paid-period end across all subscriptions.
 * exactDuplicate is set only after matching the persistent Stripe references.
 */
export function classifyPaidPeriod({
  periodKind,
  periodStart,
  periodEnd,
  lastUserPaidPeriodEnd = null,
  subscriptionHasPriorPeriod = false,
  exactDuplicate = false,
}) {
  if (
    !["initial", "cycle"].includes(periodKind) ||
    !validDate(periodStart) ||
    !validDate(periodEnd) ||
    Date.parse(periodEnd) <= Date.parse(periodStart) ||
    (lastUserPaidPeriodEnd !== null && !validDate(lastUserPaidPeriodEnd))
  ) {
    throw new TypeError("INVALID_PAID_PERIOD");
  }

  if (exactDuplicate) return { status: "duplicate" };

  if (periodKind === "initial" && subscriptionHasPriorPeriod) {
    return { status: "conflict", reason: "CREDIT_INITIAL_PERIOD_CONFLICT" };
  }

  if (periodKind === "cycle" && !subscriptionHasPriorPeriod) {
    return {
      status: "conflict",
      reason: "CREDIT_CYCLE_WITHOUT_SUBSCRIPTION_HISTORY",
    };
  }

  if (
    lastUserPaidPeriodEnd !== null &&
    Date.parse(periodStart) < Date.parse(lastUserPaidPeriodEnd)
  ) {
    return {
      status: "conflict",
      reason: "CREDIT_PERIOD_OUT_OF_ORDER_OR_OVERLAPPING",
    };
  }

  if (lastUserPaidPeriodEnd === null) {
    return { status: "grant", grantStatus: "granted_initial" };
  }

  if (Date.parse(periodStart) > Date.parse(lastUserPaidPeriodEnd)) {
    return { status: "grant", grantStatus: "granted_paid_gap" };
  }

  return { status: "grant", grantStatus: "granted_cycle" };
}

export function transitionReservation(status, action) {
  const transitions = {
    reserve: { reserved: "reserved" },
    provider_started: { reserved: "started" },
    recover: { reserved: "released", started: "uncertain" },
    commit: { started: "committed", uncertain: "committed" },
    release: { reserved: "released" },
    resolve_consumed: { started: "committed", uncertain: "committed" },
    resolve_not_consumed: { uncertain: "released" },
  };

  const next = transitions[action]?.[status];
  if (!next) {
    return { status: "conflict", reason: "CREDIT_RESERVATION_TRANSITION_INVALID" };
  }
  return { status: next };
}

export function resolveHeldCredits({
  available,
  held,
  credits,
  outcome,
}) {
  if (
    !Number.isSafeInteger(available) ||
    !Number.isSafeInteger(held) ||
    !Number.isSafeInteger(credits) ||
    available < 0 ||
    held < credits ||
    credits <= 0 ||
    !["consumed", "not_consumed"].includes(outcome)
  ) {
    throw new TypeError("INVALID_HELD_CREDIT_RESOLUTION");
  }

  const refund = outcome === "not_consumed" ? credits : 0;
  return {
    available: available + refund,
    held: held - credits,
    total: available + held - (outcome === "consumed" ? credits : 0),
  };
}

function validateReservation({ userId, requestId, operation, credits }) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new TypeError("INVALID_CLERK_USER_ID");
  }
  if (typeof requestId !== "string" || !requestId.trim()) {
    throw new TypeError("INVALID_CREDIT_REQUEST_ID");
  }
  if (!["main", "text_blueprint"].includes(operation)) {
    throw new TypeError("INVALID_CREDIT_OPERATION");
  }
  if (credits !== 1) {
    throw new TypeError("INVALID_CREDIT_AMOUNT");
  }
}

async function rpc(supabase, name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

// Server-side only: pass the existing service-role Supabase client and a
// Clerk user ID obtained from verified server authentication.
export async function reserve(supabase, input) {
  validateReservation(input);
  return rpc(supabase, "premivate_credit_reserve", {
    p_clerk_user_id: input.userId,
    p_request_id: input.requestId,
    p_operation: input.operation,
    p_credits: input.credits,
  });
}

export async function markProviderStarted(supabase, { userId, requestId }) {
  return rpc(supabase, "premivate_credit_mark_provider_started", {
    p_clerk_user_id: userId,
    p_request_id: requestId,
  });
}

export async function commit(supabase, { userId, requestId }) {
  return rpc(supabase, "premivate_credit_commit", {
    p_clerk_user_id: userId,
    p_request_id: requestId,
  });
}

export async function release(supabase, { userId, requestId }) {
  return rpc(supabase, "premivate_credit_release", {
    p_clerk_user_id: userId,
    p_request_id: requestId,
  });
}

export async function grantPaidPeriod(supabase, input) {
  return rpc(supabase, "premivate_credit_grant_paid_period", {
    p_clerk_user_id: input.userId,
    p_stripe_subscription_id: input.subscriptionId,
    p_stripe_invoice_id: input.invoiceId,
    p_stripe_event_id: input.eventId,
    p_period_kind: input.periodKind,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
  });
}

export async function grantPurchasedCredits(supabase, input) {
  if (
    typeof input.userId !== "string" ||
    !input.userId ||
    typeof input.paymentIntentId !== "string" ||
    !input.paymentIntentId ||
    !Number.isSafeInteger(input.credits) ||
    input.credits <= 0
  ) {
    throw new TypeError("INVALID_TOPUP_GRANT");
  }

  return rpc(supabase, "premivate_credit_grant_purchased", {
    p_clerk_user_id: input.userId,
    p_stripe_payment_intent_id: input.paymentIntentId,
    p_credits: input.credits,
  });
}
