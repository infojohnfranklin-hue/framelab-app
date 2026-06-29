import { Redis } from "@upstash/redis";

const hasRedis =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export async function getFreeUses(identifier) {
  if (!identifier || !redis) return 0;

  try {
    const count = await redis.get(identifier);
    return count || 0;
  } catch (error) {
    console.error("Redis getFreeUses error:", error);
    return 0;
  }
}

export async function increaseFreeUses(identifier) {
  if (!identifier || !redis) return;

  try {
    await redis.incr(identifier);
  } catch (error) {
    console.error("Redis increaseFreeUses error:", error);
  }
}
export async function getRemainingCredits(identifier) {
  const used = await getFreeUses(identifier);
  return Math.max(3 - used, 0);
}