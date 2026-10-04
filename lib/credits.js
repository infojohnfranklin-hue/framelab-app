import { Redis } from "@upstash/redis";

export const FREE_CREDIT_LIMIT = 2;

const RESERVATION_TTL_MS = 30 * 60 * 1000;
const REQUEST_TTL_SECONDS = 24 * 60 * 60;
const FAILED_REQUEST_TTL_SECONDS = 60 * 60;

const hasRedis =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const redisNamespace =
  String(process.env.FRAMELAB_REDIS_NAMESPACE || "").trim();

function namespacedRedisKey(key) {
  return redisNamespace
    ? `${redisNamespace}:${key}`
    : key;
}

function requireRedis() {
  if (!redis) {
    const error = new Error("Credit store unavailable");
    error.code = "CREDIT_STORE_UNAVAILABLE";
    throw error;
  }

  return redis;
}

function usedCreditsKey(userId) {
  return namespacedRedisKey(
    `framelab:free-credits:used:${userId}`
  );
}

function reservationKey(userId) {
  return namespacedRedisKey(
    `framelab:free-credits:reservations:${userId}`
  );
}

function requestKey(userId, generationRequestId) {
  return namespacedRedisKey(
    `framelab:generate-request:${userId}:${generationRequestId}`
  );
}

export async function getFreeUses(identifier) {
  if (!identifier || !redis) return 0;

  try {
    const count =
      await redis.get(namespacedRedisKey(identifier));
    return Number(count) || 0;
  } catch (error) {
    console.error("Redis getFreeUses error:", error);
    return 0;
  }
}

export async function increaseFreeUses(identifier) {
  if (!identifier || !redis) return;

  try {
    await redis.incr(namespacedRedisKey(identifier));
  } catch (error) {
    console.error("Redis increaseFreeUses error:", error);
  }
}

export async function getRemainingCredits(identifier) {
  const used = await getFreeUses(identifier);
  return Math.max(FREE_CREDIT_LIMIT - used, 0);
}

export async function getCreditSnapshot(userId) {
  const client = requireRedis();
  const now = Date.now();

  const raw = await client.eval(
    `
      local now = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])

      redis.call("ZREMRANGEBYSCORE", KEYS[2], "-inf", now)

      local used = tonumber(redis.call("GET", KEYS[1]) or "0")
      local reserved = tonumber(redis.call("ZCARD", KEYS[2]) or "0")
      local remaining = limit - used - reserved

      if remaining < 0 then
        remaining = 0
      end

      return { used, reserved, remaining }
    `,
    [
      usedCreditsKey(userId),
      reservationKey(userId),
    ],
    [
      String(now),
      String(FREE_CREDIT_LIMIT),
    ]
  );

  return {
    used: Number(raw?.[0] || 0),
    reserved: Number(raw?.[1] || 0),
    remaining: Number(raw?.[2] || 0),
  };
}

export async function reserveFreeGenerate(
  userId,
  generationRequestId
) {
  const client = requireRedis();
  const now = Date.now();

  const raw = await client.eval(
    `
      local limit = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local reservationTtl = tonumber(ARGV[3])
      local requestId = ARGV[4]
      local requestTtl = tonumber(ARGV[5])

      redis.call("ZREMRANGEBYSCORE", KEYS[2], "-inf", now)

      local status = redis.call("HGET", KEYS[3], "status")

      if status == "COMPLETED" then
        return {
          "COMPLETED",
          redis.call("HGET", KEYS[3], "result") or ""
        }
      end

      if status == "RESERVED" then
        local score = redis.call("ZSCORE", KEYS[2], requestId)

        if score and tonumber(score) > now then
          return { "IN_PROGRESS", "" }
        end

        redis.call("HSET", KEYS[3], "status", "FAILED")
      end

      local used =
        tonumber(redis.call("GET", KEYS[1]) or "0")

      local active =
        tonumber(redis.call("ZCARD", KEYS[2]) or "0")

      if used + active >= limit then
        return { "LIMIT", "" }
      end

      local expiresAt = now + reservationTtl

      redis.call(
        "ZADD",
        KEYS[2],
        expiresAt,
        requestId
      )

      redis.call(
        "HSET",
        KEYS[3],
        "status",
        "RESERVED"
      )

      redis.call(
        "HDEL",
        KEYS[3],
        "result"
      )

      redis.call(
        "EXPIRE",
        KEYS[3],
        requestTtl
      )

      return { "RESERVED", "" }
    `,
    [
      usedCreditsKey(userId),
      reservationKey(userId),
      requestKey(userId, generationRequestId),
    ],
    [
      String(FREE_CREDIT_LIMIT),
      String(now),
      String(RESERVATION_TTL_MS),
      generationRequestId,
      String(REQUEST_TTL_SECONDS),
    ]
  );

  const status = String(raw?.[0] || "");
  const payload = raw?.[1];

  if (status === "COMPLETED") {
    if (!payload) {
      throw new Error(
        "Completed generation is missing cached result"
      );
    }

    return {
      status,
      result: JSON.parse(payload),
    };
  }

  return { status };
}

export async function completeFreeGenerate(
  userId,
  generationRequestId,
  result
) {
  const client = requireRedis();
  const now = Date.now();
  const serializedResult = JSON.stringify(result);

  const raw = await client.eval(
    `
      local limit = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local requestId = ARGV[3]
      local requestTtl = tonumber(ARGV[4])
      local serializedResult = ARGV[5]

      local status =
        redis.call("HGET", KEYS[3], "status")

      if status == "COMPLETED" then
        local used =
          tonumber(redis.call("GET", KEYS[1]) or "0")

        local remaining = limit - used

        if remaining < 0 then
          remaining = 0
        end

        return {
          "COMPLETED",
          tostring(remaining)
        }
      end

      if status ~= "RESERVED" then
        return { "FAILED", "" }
      end

      local score =
        redis.call("ZSCORE", KEYS[2], requestId)

      if not score or tonumber(score) <= now then
        redis.call("ZREM", KEYS[2], requestId)

        redis.call(
          "HSET",
          KEYS[3],
          "status",
          "FAILED"
        )

        redis.call(
          "EXPIRE",
          KEYS[3],
          requestTtl
        )

        return { "EXPIRED", "" }
      end

      local used =
        tonumber(redis.call("GET", KEYS[1]) or "0")

      if used >= limit then
        redis.call("ZREM", KEYS[2], requestId)

        redis.call(
          "HSET",
          KEYS[3],
          "status",
          "FAILED"
        )

        redis.call(
          "EXPIRE",
          KEYS[3],
          requestTtl
        )

        return { "LIMIT", "" }
      end

      local newUsed =
        tonumber(redis.call("INCR", KEYS[1]))

      redis.call(
        "ZREM",
        KEYS[2],
        requestId
      )

      redis.call(
        "HSET",
        KEYS[3],
        "status",
        "COMPLETED",
        "result",
        serializedResult
      )

      redis.call(
        "EXPIRE",
        KEYS[3],
        requestTtl
      )

      local remaining = limit - newUsed

      if remaining < 0 then
        remaining = 0
      end

      return {
        "COMPLETED",
        tostring(remaining)
      }
    `,
    [
      usedCreditsKey(userId),
      reservationKey(userId),
      requestKey(userId, generationRequestId),
    ],
    [
      String(FREE_CREDIT_LIMIT),
      String(now),
      generationRequestId,
      String(REQUEST_TTL_SECONDS),
      serializedResult,
    ]
  );

  return {
    status: String(raw?.[0] || ""),
    remaining:
      raw?.[1] === ""
        ? null
        : Number(raw?.[1]),
  };
}

export async function failFreeGenerate(
  userId,
  generationRequestId
) {
  const client = requireRedis();

  return client.eval(
    `
      local requestId = ARGV[1]
      local failedTtl = tonumber(ARGV[2])

      local status =
        redis.call("HGET", KEYS[2], "status")

      if status == "RESERVED" then
        redis.call(
          "ZREM",
          KEYS[1],
          requestId
        )

        redis.call(
          "HSET",
          KEYS[2],
          "status",
          "FAILED"
        )

        redis.call(
          "HDEL",
          KEYS[2],
          "result"
        )

        redis.call(
          "EXPIRE",
          KEYS[2],
          failedTtl
        )

        return "FAILED"
      end

      return status or "MISSING"
    `,
    [
      reservationKey(userId),
      requestKey(userId, generationRequestId),
    ],
    [
      generationRequestId,
      String(FAILED_REQUEST_TTL_SECONDS),
    ]
  );
}
