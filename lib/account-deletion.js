import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";

const ACCOUNT_OPERATION_TTL_MS = 60 * 60 * 1000;

function accountOperationKey(userId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!isValidClerkUserId(userId)) throw new TypeError("ACCOUNT_DELETION_USER_ID_INVALID");
  const prefix = String(namespace || "").trim();
  return `${prefix ? `${prefix}:` : ""}framelab:account-deletion:operations:${userId}`;
}

export function createAccountDeletionRedis(env = process.env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("ACCOUNT_DELETION_REDIS_UNAVAILABLE");
  }
  return new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
}

export async function beginAccountRedisOperation(redis, userId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!isSelfServiceDeletionEnabled() || !redis || !isValidClerkUserId(userId)) return null;
  const operationId = randomUUID();
  const result = await redis.eval(
    `
      if redis.call("EXISTS", KEYS[1]) == 1 then return 0 end
      local now = tonumber(ARGV[1])
      redis.call("ZREMRANGEBYSCORE", KEYS[2], "-inf", now)
      redis.call("ZADD", KEYS[2], now + tonumber(ARGV[2]), ARGV[3])
      return 1
    `,
    [deletionGuardKey(userId, namespace), accountOperationKey(userId, namespace)],
    [String(Date.now()), String(ACCOUNT_OPERATION_TTL_MS), operationId]
  );
  if (result !== 1) {
    const error = new Error("ACCOUNT_DELETION_IN_PROGRESS");
    error.status = 410;
    error.safeCode = "ACCOUNT_DELETION_IN_PROGRESS";
    throw error;
  }
  return operationId;
}

export async function finishAccountRedisOperation(redis, userId, operationId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!operationId) return;
  if (!redis || !isValidClerkUserId(userId)) throw new Error("ACCOUNT_DELETION_REDIS_UNAVAILABLE");
  await redis.zrem(accountOperationKey(userId, namespace), operationId);
}

export function isSelfServiceDeletionEnabled(env = process.env) {
  return env.PREMIVATE_SELF_SERVICE_ACCOUNT_DELETION_ENABLED === "true";
}

export function isValidClerkUserId(userId) {
  return typeof userId === "string" &&
    userId.length <= 64 &&
    /^user_[A-Za-z0-9]+$/.test(userId);
}

export function deletionGuardKey(userId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!isValidClerkUserId(userId)) throw new TypeError("ACCOUNT_DELETION_USER_ID_INVALID");
  const hash = createHash("sha256").update(userId, "utf8").digest("hex");
  const prefix = String(namespace || "").trim();
  return `${prefix ? `${prefix}:` : ""}framelab:account-deletion:blocked:${hash}`;
}

export async function getSelfServiceDeletionState(supabase, userId, env = process.env) {
  if (!isSelfServiceDeletionEnabled(env)) return { stage: "none", enabled: false };
  if (!isValidClerkUserId(userId)) throw new TypeError("ACCOUNT_DELETION_USER_ID_INVALID");
  const { data, error } = await supabase.rpc("premivate_self_service_deletion_status", {
    p_clerk_user_id: userId,
  });
  if (error || !data || typeof data.stage !== "string") {
    throw new Error("ACCOUNT_DELETION_STATUS_UNAVAILABLE");
  }
  return { ...data, enabled: true };
}

export async function getSelfServiceDeletionPreflight(supabase, userId, env = process.env) {
  if (!isSelfServiceDeletionEnabled(env)) return { enabled: false };
  if (!isValidClerkUserId(userId)) throw new TypeError("ACCOUNT_DELETION_USER_ID_INVALID");
  const { data, error } = await supabase.rpc("premivate_self_service_deletion_preflight", {
    p_clerk_user_id: userId,
  });
  if (error || !data || typeof data.status !== "string" || !data.balance ||
      !Array.isArray(data.blockers)) {
    throw new Error("ACCOUNT_DELETION_PREFLIGHT_UNAVAILABLE");
  }
  return { ...data, enabled: true };
}

export async function isAccountDeletionMarked(supabase, userId, env = process.env) {
  if (!isSelfServiceDeletionEnabled(env)) return false;
  const state = await getSelfServiceDeletionState(supabase, userId, env);
  return state.stage !== "none";
}

export async function isAccountDeletionInProgress(supabase, userId, env = process.env) {
  if (!isSelfServiceDeletionEnabled(env)) return false;
  const state = await getSelfServiceDeletionState(supabase, userId, env);
  return state.stage !== "none";
}

export async function assertAccountNotDeleting(supabase, userId, env = process.env) {
  if (!(await isAccountDeletionInProgress(supabase, userId, env))) return true;
  const error = new Error("ACCOUNT_DELETION_IN_PROGRESS");
  error.status = 410;
  error.safeCode = "ACCOUNT_DELETION_IN_PROGRESS";
  throw error;
}

export async function beginAccountRedisDeletion(redis, userId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!redis || !isValidClerkUserId(userId)) throw new Error("ACCOUNT_DELETION_REDIS_UNAVAILABLE");
  const guardKey = deletionGuardKey(userId, namespace);
  const prefix = String(namespace || "").trim();
  const reservationsKey = `${prefix ? `${prefix}:` : ""}framelab:free-credits:reservations:${userId}`;
  const operationsKey = accountOperationKey(userId, namespace);
  const result = await redis.eval(
    `
      local current = redis.call("GET", KEYS[1])
      if current then return 2 end
      local now = tonumber(ARGV[1])
      redis.call("ZREMRANGEBYSCORE", KEYS[2], "-inf", now)
      redis.call("ZREMRANGEBYSCORE", KEYS[3], "-inf", now)
      if tonumber(redis.call("ZCARD", KEYS[2]) or "0") > 0 or
         tonumber(redis.call("ZCARD", KEYS[3]) or "0") > 0 then return 0 end
      local created = redis.call("SET", KEYS[1], "deleting", "NX")
      if not created then return 2 end
      return 1
    `,
    [guardKey, reservationsKey, operationsKey],
    [String(Date.now())]
  );
  if (result === 0) return { status: "busy" };
  if (result === 1) return { status: "marked" };
  if (result === 2) return { status: "already_marked" };
  throw new Error("ACCOUNT_DELETION_REDIS_UNEXPECTED_RESULT");
}

export async function clearAccountRedisDeletionGuard(redis, userId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!redis || !isValidClerkUserId(userId)) throw new Error("ACCOUNT_DELETION_REDIS_UNAVAILABLE");
  await redis.del(deletionGuardKey(userId, namespace));
}

export async function scanAccountRedisKeys(redis, userId, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  if (!isValidClerkUserId(userId)) throw new TypeError("ACCOUNT_DELETION_USER_ID_INVALID");
  const prefix = String(namespace || "").trim();
  const base = prefix ? `${prefix}:` : "";
  const exactKeys = new Set([
    `${base}framelab:free-credits:used:${userId}`,
    `${base}framelab:free-credits:reservations:${userId}`,
    accountOperationKey(userId, namespace),
  ]);
  const requestPrefix = `${base}framelab:generate-request:${userId}:`;
  const requestPattern = `${requestPrefix}*`;
  const found = new Set();

  for (const pattern of [...exactKeys, requestPattern]) {
    let cursor = "0";
    const seenCursors = new Set();
    let completed = false;
    for (let page = 0; page < 100; page += 1) {
      if (seenCursors.has(cursor)) throw new Error("REDIS_SCAN_CURSOR_REPEATED");
      seenCursors.add(cursor);
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      if (!Array.isArray(result) || result.length !== 2 || !Array.isArray(result[1])) {
        throw new Error("REDIS_SCAN_SCHEMA_INVALID");
      }
      cursor = String(result[0]);
      for (const key of result[1]) {
        const isExact = exactKeys.has(key);
        const suffix = typeof key === "string" && key.startsWith(requestPrefix)
          ? key.slice(requestPrefix.length)
          : "";
        if (!isExact && (!suffix || suffix.includes(":"))) {
          throw new Error("REDIS_SCAN_KEY_SCOPE_INVALID");
        }
        found.add(key);
      }
      if (cursor === "0") {
        completed = true;
        break;
      }
    }
    if (!completed) throw new Error("REDIS_SCAN_PAGE_LIMIT_REACHED");
  }
  return [...found];
}

export async function deleteAccountRedisData(redis, userId, scannedKeys, namespace = process.env.FRAMELAB_REDIS_NAMESPACE || "") {
  const allowed = new Set(await scanAccountRedisKeys(redis, userId, namespace));
  for (const key of scannedKeys) {
    if (!allowed.has(key)) throw new Error("REDIS_DELETE_KEY_SCOPE_INVALID");
  }
  for (let offset = 0; offset < scannedKeys.length; offset += 100) {
    await redis.del(...scannedKeys.slice(offset, offset + 100));
  }
  if ((await scanAccountRedisKeys(redis, userId, namespace)).length !== 0) {
    throw new Error("REDIS_USER_KEYS_REMAIN");
  }
}
