import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import { isPremivateOwner, supabase } from "../../../lib/pro";

const PREVIEW_SUPABASE_HOST = "kycsxjrvfgddxfmoieab.supabase.co";
const PREVIEW_REDIS_NAMESPACE = "premivate-preview";
const REDIS_SCAN_PAGE_LIMIT = 100;
const CLERK_SESSION_LIMIT = 100;
const CLERK_SESSION_MAX = 500;

function isDedicatedPreview() {
  let databaseHost = "";
  try {
    databaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname;
  } catch {
    return false;
  }

  return process.env.PREMIVATE_SUPPORT_DELETION_ENABLED === "true" &&
    process.env.VERCEL_ENV === "preview" &&
    databaseHost === PREVIEW_SUPABASE_HOST &&
    process.env.FRAMELAB_REDIS_NAMESPACE === PREVIEW_REDIS_NAMESPACE &&
    /^pk_test_[A-Za-z0-9_-]+$/.test(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "") &&
    /^sk_test_[A-Za-z0-9_-]+$/.test(process.env.CLERK_SECRET_KEY || "") &&
    !process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_WEBHOOK_SECRET;
}

function validClerkUserId(value) {
  return typeof value === "string" && value.length <= 64 && /^user_[A-Za-z0-9]+$/.test(value);
}

function isAllowedUserKey(key, userId) {
  const namespace = PREVIEW_REDIS_NAMESPACE;
  const exactUsed = namespace + ":framelab:free-credits:used:" + userId;
  const exactReservations = namespace + ":framelab:free-credits:reservations:" + userId;
  const requestPrefix = namespace + ":framelab:generate-request:" + userId + ":";
  return key === exactUsed || key === exactReservations ||
    (key.startsWith(requestPrefix) && key.length > requestPrefix.length && !key.slice(requestPrefix.length).includes(":"));
}

async function scanUserRedisKeys(redis, userId) {
  const namespace = PREVIEW_REDIS_NAMESPACE;
  const patterns = [
    namespace + ":framelab:free-credits:used:" + userId,
    namespace + ":framelab:free-credits:reservations:" + userId,
    namespace + ":framelab:generate-request:" + userId + ":*",
  ];
  const allKeys = new Set();

  for (const match of patterns) {
    let cursor = "0";
    const seenCursors = new Set();
    for (let page = 0; page < REDIS_SCAN_PAGE_LIMIT; page += 1) {
      if (seenCursors.has(cursor)) throw new Error("REDIS_SCAN_CURSOR_REPEATED");
      seenCursors.add(cursor);
      const result = await redis.scan(cursor, { match, count: 100 });
      if (!Array.isArray(result) || result.length !== 2 || !Array.isArray(result[1])) {
        throw new Error("REDIS_SCAN_SCHEMA_INVALID");
      }
      cursor = String(result[0]);
      for (const key of result[1]) {
        if (typeof key !== "string" || !isAllowedUserKey(key, userId)) {
          throw new Error("REDIS_SCAN_KEY_SCOPE_INVALID");
        }
        allKeys.add(key);
      }
      if (cursor === "0") break;
      if (page === REDIS_SCAN_PAGE_LIMIT - 1) throw new Error("REDIS_SCAN_PAGE_LIMIT_REACHED");
    }
  }
  return [...allKeys];
}

async function deleteUserRedisKeys(redis, userId, scannedKeys) {
  for (let offset = 0; offset < scannedKeys.length; offset += 100) {
    await redis.del(...scannedKeys.slice(offset, offset + 100));
  }
  if ((await scanUserRedisKeys(redis, userId)).length !== 0) {
    throw new Error("REDIS_USER_KEYS_REMAIN");
  }
}

async function getActiveSessionIds(clerk, userId) {
  const ids = [];
  for (let offset = 0; offset <= CLERK_SESSION_MAX; offset += CLERK_SESSION_LIMIT) {
    const result = await clerk.sessions.getSessionList({
      userId,
      status: "active",
      limit: CLERK_SESSION_LIMIT,
      offset,
    });
    const page = Array.isArray(result?.data) ? result.data : null;
    if (!page) throw new Error("CLERK_SESSION_LIST_INVALID");
    for (const session of page) {
      if (typeof session?.id !== "string" || !session.id) throw new Error("CLERK_SESSION_ID_INVALID");
      ids.push(session.id);
      if (ids.length > CLERK_SESSION_MAX) throw new Error("CLERK_SESSION_LIMIT_REACHED");
    }
    if (page.length < CLERK_SESSION_LIMIT) return ids;
  }
  throw new Error("CLERK_SESSION_LIMIT_REACHED");
}

async function readPreflight(userId) {
  const { data, error } = await supabase.rpc("premivate_account_deletion_preflight", {
    p_clerk_user_id: userId,
  });
  if (error) throw new Error("ACCOUNT_DELETION_PREFLIGHT_UNAVAILABLE");
  if (!data || typeof data.status !== "string" || !Array.isArray(data.blockers)) {
    throw new Error("ACCOUNT_DELETION_PREFLIGHT_INVALID");
  }
  return data;
}

function sendError(res, status, code) {
  return res.status(status).json({ status: "blocked", code });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "METHOD_NOT_ALLOWED");
  }
  if (!isDedicatedPreview()) return res.status(404).json({ status: "unavailable" });

  const { userId: actorId } = getAuth(req);
  if (!actorId || !isPremivateOwner(actorId)) return sendError(res, 403, "SUPPORT_OWNER_REQUIRED");

  const targetUserId = req.body?.targetUserId;
  const operation = req.body?.operation;
  if (!validClerkUserId(targetUserId) || targetUserId === actorId) {
    return sendError(res, 400, "TARGET_USER_INVALID");
  }
  if (operation !== "dry-run" && operation !== "execute") return sendError(res, 400, "OPERATION_INVALID");
  if (operation === "execute" && req.body?.confirmUserId !== targetUserId) {
    return sendError(res, 400, "TARGET_CONFIRMATION_REQUIRED");
  }

  let redis;
  let deletionReport;
  let redisKeys;
  let activeSessionIds;
  try {
    const clerk = await clerkClient();
    const targetUser = await clerk.users.getUser(targetUserId);
    if (targetUser?.publicMetadata?.premivateDeletionTest !== true) {
      return sendError(res, 409, "DEDICATED_SYNTHETIC_TEST_USER_REQUIRED");
    }
    deletionReport = await readPreflight(targetUserId);
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisKeys = await scanUserRedisKeys(redis, targetUserId);
    activeSessionIds = await getActiveSessionIds(clerk, targetUserId);
  } catch {
    return sendError(res, 503, "PREFLIGHT_UNAVAILABLE");
  }

  const responseSummary = {
    counts: deletionReport.counts && typeof deletionReport.counts === "object" ? deletionReport.counts : {},
    redisKeys: redisKeys.length,
    activeSessions: activeSessionIds.length,
    blockers: deletionReport.blockers,
    browserLocalCleanupRequired: true,
    stripeLinkedAccountsSupported: false,
  };

  if (operation === "dry-run") {
    const ready = deletionReport.status === "ready" || deletionReport.status === "already_marked";
    return res.status(ready ? 200 : 409).json({ status: deletionReport.status, ...responseSummary });
  }
  if (deletionReport.status !== "ready" && deletionReport.status !== "already_marked") {
    return res.status(409).json({ status: "blocked", ...responseSummary });
  }

  const clerk = await clerkClient();
  try {
    await clerk.users.banUser(targetUserId);
    for (const sessionId of activeSessionIds) await clerk.sessions.revokeSession(sessionId);
  } catch {
    return sendError(res, 502, "CLERK_SESSION_REVOCATION_FAILED");
  }

  const { data: deletionResult, error: deletionError } = await supabase.rpc("premivate_account_deletion_commit", {
    p_clerk_user_id: targetUserId,
  });
  if (deletionError || !deletionResult || !["deleted", "already_marked"].includes(deletionResult.status)) {
    return sendError(res, 409, "DATABASE_DELETION_BLOCKED");
  }

  try {
    await deleteUserRedisKeys(redis, targetUserId, redisKeys);
  } catch {
    return sendError(res, 502, "REDIS_CLEANUP_INCOMPLETE");
  }
  try {
    await clerk.users.deleteUser(targetUserId);
  } catch {
    return sendError(res, 502, "CLERK_DELETION_INCOMPLETE");
  }

  return res.status(200).json({
    status: "deleted",
    counts: {
      ...responseSummary.counts,
      historyRowsDeleted: deletionResult.historyRowsDeleted || 0,
      profilesDeleted: deletionResult.profilesDeleted || 0,
    },
    browserLocalCleanupRequired: true,
    retainedSuppressionFingerprint: true,
    stripeLinkedAccountsSupported: false,
  });
}
