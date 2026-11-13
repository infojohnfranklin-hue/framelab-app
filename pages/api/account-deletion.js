import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import {
  clerkClient,
  getAuth,
  reverificationErrorResponse,
} from "@clerk/nextjs/server";
import { supabase } from "../../lib/pro";
import { getCreditSnapshot } from "../../lib/credits";
import {
  beginAccountRedisDeletion,
  clearAccountRedisDeletionGuard,
  deleteAccountRedisData,
  getSelfServiceDeletionPreflight,
  getSelfServiceDeletionState,
  isSelfServiceDeletionEnabled,
  scanAccountRedisKeys,
} from "../../lib/account-deletion";
import { stripeSecretMatchesEnvironment } from "../../lib/stripe-mode";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active", "trialing", "past_due", "unpaid", "incomplete", "paused",
]);
function fail(res, status, code) {
  return res.status(status).json({ error: code });
}

function stripeObjectId(value) {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : null;
}

function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("ACCOUNT_DELETION_REDIS_UNAVAILABLE");
  return new Redis({ url, token });
}

async function callDeletionRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error || !data || typeof data !== "object") throw new Error(`${name.toUpperCase()}_UNAVAILABLE`);
  return data;
}

async function cancelLinkedStripeObjects(userId, subscriptionData) {
  const customerId = typeof subscriptionData?.customerId === "string" ? subscriptionData.customerId : null;
  const linkedSubscriptionId = typeof subscriptionData?.subscriptionId === "string" ? subscriptionData.subscriptionId : null;
  if (!customerId && !linkedSubscriptionId) {
    if (String(subscriptionData?.plan || "").toLowerCase().includes("pro")) {
      throw new Error("STRIPE_SUBSCRIPTION_LINKAGE_UNVERIFIABLE");
    }
    return;
  }
  if (!customerId || !process.env.STRIPE_SECRET_KEY || !stripeSecretMatchesEnvironment(process.env)) {
    throw new Error("STRIPE_DELETION_UNAVAILABLE");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.id !== customerId || customer.deleted === true ||
      customer.metadata?.clerkUserId !== userId) {
    throw new Error("STRIPE_CUSTOMER_OWNERSHIP_UNVERIFIABLE");
  }

  const [subscriptions, openSessions] = await Promise.all([
    stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 }),
    stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 }),
  ]);
  if (subscriptions?.has_more === true || !Array.isArray(subscriptions?.data) ||
      openSessions?.has_more === true || !Array.isArray(openSessions?.data)) {
    throw new Error("STRIPE_LOOKUP_INCOMPLETE");
  }

  const linked = subscriptions.data;
  if (linkedSubscriptionId && !linked.some((item) => item.id === linkedSubscriptionId)) {
    throw new Error("STRIPE_SUBSCRIPTION_LINKAGE_UNVERIFIABLE");
  }
  for (const subscription of linked) {
    if (stripeObjectId(subscription.customer) !== customerId ||
        subscription.metadata?.clerkUserId !== userId) {
      throw new Error("STRIPE_SUBSCRIPTION_OWNERSHIP_UNVERIFIABLE");
    }
  }
  for (const session of openSessions.data) {
    if (stripeObjectId(session.customer) !== customerId || session.metadata?.clerkUserId !== userId) {
      throw new Error("STRIPE_CHECKOUT_OWNERSHIP_UNVERIFIABLE");
    }
  }

  for (const subscription of linked) {
    if (subscription.status === "canceled" || subscription.status === "incomplete_expired") continue;
    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      throw new Error("STRIPE_SUBSCRIPTION_STATUS_UNSUPPORTED");
    }
    const cancelled = await stripe.subscriptions.cancel(subscription.id, {
      invoice_now: false,
      prorate: false,
    });
    if (cancelled?.id !== subscription.id || cancelled.status !== "canceled") {
      throw new Error("STRIPE_SUBSCRIPTION_CANCELLATION_UNCONFIRMED");
    }
  }

  for (const session of openSessions.data) {
    const expired = await stripe.checkout.sessions.expire(session.id);
    if (expired?.id !== session.id || expired.status !== "expired") {
      throw new Error("STRIPE_CHECKOUT_EXPIRATION_UNCONFIRMED");
    }
  }
}

function sameOriginPost(req) {
  const fetchSite = req.headers["sec-fetch-site"];
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site" && fetchSite !== "none") return false;
  const origin = req.headers.origin;
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (typeof origin !== "string" || !host) return false;
  try { return new URL(origin).host.toLowerCase() === host.toLowerCase(); }
  catch { return false; }
}

function publicPreflight(preflight, stage) {
  return {
    enabled: true,
    status: preflight.status,
    stage,
    blockers: preflight.blockers,
    balance: preflight.balance,
    counts: preflight.counts,
    subscription: {
      plan: preflight.subscription?.plan || "free",
      status: preflight.subscription?.status || null,
      cancelAtPeriodEnd: preflight.subscription?.cancelAtPeriodEnd === true,
    },
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return fail(res, 405, "METHOD_NOT_ALLOWED");
  }
  if (!isSelfServiceDeletionEnabled(process.env)) {
    return req.method === "GET"
      ? res.status(200).json({ enabled: false })
      : res.status(404).json({ enabled: false });
  }

  try {
    const auth = getAuth(req);
    if (!auth.userId) return fail(res, 401, "AUTH_REQUIRED");

    if (req.method === "GET") {
      const [state, preflight, freeCredits] = await Promise.all([
        getSelfServiceDeletionState(supabase, auth.userId, process.env),
        getSelfServiceDeletionPreflight(supabase, auth.userId, process.env),
        getCreditSnapshot(auth.userId),
      ]);
      preflight.balance.freeRemaining = freeCredits.remaining;
      preflight.balance.freeReserved = freeCredits.reserved;
      return res.status(200).json(publicPreflight(preflight, state.stage));
    }

    if (!sameOriginPost(req)) return fail(res, 403, "SAME_ORIGIN_REQUIRED");
    if (!auth.has?.({ reverification: "strict" })) {
      const response = reverificationErrorResponse("strict");
      return res.status(response.status).json(await response.json());
    }
    if (req.body?.confirmation !== "DELETE" || req.body?.acknowledged !== true) {
      return fail(res, 400, "DELETE_CONFIRMATION_REQUIRED");
    }

    const userId = auth.userId;
    let state = await getSelfServiceDeletionState(supabase, userId, process.env);
    let preflight = await getSelfServiceDeletionPreflight(supabase, userId, process.env);
    if (state.stage === "none" && (preflight.status !== "ready" || preflight.blockers.length > 0)) {
      return res.status(409).json({
        error: "ACCOUNT_DELETION_BLOCKED",
        blockers: preflight.blockers,
        balance: preflight.balance,
      });
    }

    const redis = createRedis();
    const redisMark = await beginAccountRedisDeletion(redis, userId);
    if (redisMark.status === "busy") {
      return res.status(409).json({ error: "GENERATION_IN_PROGRESS" });
    }

    if (state.stage === "none") {
      const begun = await callDeletionRpc("premivate_self_service_deletion_begin", {
        p_clerk_user_id: userId,
      });
      if (begun.status === "blocked" || (Array.isArray(begun.blockers) && begun.blockers.length > 0)) {
        await clearAccountRedisDeletionGuard(redis, userId);
        return res.status(409).json({ error: "ACCOUNT_DELETION_BLOCKED", blockers: begun.blockers || [] });
      }
      state = await getSelfServiceDeletionState(supabase, userId, process.env);
      preflight = await getSelfServiceDeletionPreflight(supabase, userId, process.env);
    }

    if (state.stage === "pending") {
      await cancelLinkedStripeObjects(userId, preflight.subscription);
      const advanced = await callDeletionRpc("premivate_self_service_deletion_advance", {
        p_clerk_user_id: userId,
        p_expected_stage: "pending",
        p_next_stage: "stripe_complete",
      });
      if (advanced.stage !== "stripe_complete") throw new Error("ACCOUNT_DELETION_STAGE_ADVANCE_UNCONFIRMED");
      state = { stage: "stripe_complete" };
    }

    if (state.stage === "stripe_complete") {
      const committed = await callDeletionRpc("premivate_self_service_deletion_commit", {
        p_clerk_user_id: userId,
      });
      if (committed.stage !== "data_deleted") throw new Error("ACCOUNT_DELETION_DATA_DELETE_UNCONFIRMED");
      state = { stage: "data_deleted" };
    }

    if (state.stage !== "data_deleted") return fail(res, 503, "ACCOUNT_DELETION_INCOMPLETE");

    const redisKeys = await scanAccountRedisKeys(redis, userId);
    await deleteAccountRedisData(redis, userId, redisKeys);

    const clerk = await clerkClient();
    const deletedUser = await clerk.users.deleteUser(userId);
    if (deletedUser?.id !== userId || deletedUser?.deleted !== true) {
      throw new Error("CLERK_DELETION_UNCONFIRMED");
    }

    return res.status(200).json({
      status: "deleted",
      browserLocalCleanupRequired: true,
      retainedDeletionFingerprint: true,
      retainedExternalFinancialRecords: true,
    });
  } catch (error) {
    const code = typeof error?.message === "string" && /^[A-Z0-9_]+$/.test(error.message)
      ? error.message
      : "ACCOUNT_DELETION_INCOMPLETE";
    console.error("Account deletion did not complete", { code });
    return res.status(503).json({ error: code, retryable: true });
  }
}
