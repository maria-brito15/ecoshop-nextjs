// lib/redis.ts

/**
 * REDIS CLIENT
 *
 * Shared Redis client (cache and rate limit). Redis is OPTIONAL: without it the
 * application keeps working, with degraded cache and rate limit (ADR-0020).
 *
 * Fail fast (REQ-OPS-14): node-redis queues commands while disconnected and,
 * without a limit, a request would hang until reconnection. Therefore:
 * - every command has a time limit (`withTimeout`); on timeout it counts as a failure;
 * - the offline queue has a maximum size;
 * - the connection has a time limit and reconnection backs off from 200 ms to 5 s.
 *
 * The `redisGet/Set/Del/DelPattern` functions never throw: a failure becomes a
 * "miss" (or no-op) and is logged at most once every 30 s.
 */

import { createClient, RedisClientType } from "redis";
import { log, serializeError, throttle } from "@/lib/log";

/** Time limit for an ordinary command (initial value, not measured). */
export const COMMAND_TIMEOUT_MS = 300;
/** Scanning keys by pattern is slower: it has its own limit. */
const SCAN_TIMEOUT_MS = 3000;
const MAX_OFFLINE_QUEUE = 100;

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

const canWarn = throttle(30_000);

/** Logs the Redis failure, at most once every 30 s per type. */
export function warnRedisFailure(event: string, err: unknown) {
  if (canWarn(event)) log.warn(event, { error: serializeError(err) });
}

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = createClient({
    url,
    commandsQueueMaxLength: MAX_OFFLINE_QUEUE,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: (attempts: number) => Math.min(attempts * 200, 5000),
    },
  }) as RedisClientType;

  client.on("error", (err) => warnRedisFailure("redis.connection_error", err));

  client
    .connect()
    .catch((err) => warnRedisFailure("redis.connect_failed", err));

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Rejects if `promise` does not finish within `ms`. The original promise keeps going
 * (Redis does not cancel commands), but the waiter is released.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, rejects) => {
    timer = setTimeout(
      () => rejects(new Error(`Redis did not respond within ${ms} ms`)),
      ms,
    );
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

/**
 * Reads and parses a cache value.
 * @returns the value, or `null` if it does not exist or Redis failed
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await withTimeout(redis.get(key), COMMAND_TIMEOUT_MS);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    warnRedisFailure("redis.get_failed", err);
    return null;
  }
}

/** Stores a value with a TTL. A Redis failure does not propagate. */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    await withTimeout(
      redis.set(key, JSON.stringify(value), { EX: ttlSeconds }),
      COMMAND_TIMEOUT_MS,
    );
  } catch (err) {
    warnRedisFailure("redis.set_failed", err);
  }
}

/** Removes a key. A Redis failure does not propagate. */
export async function redisDel(key: string): Promise<void> {
  try {
    await withTimeout(redis.del(key), COMMAND_TIMEOUT_MS);
  } catch (err) {
    warnRedisFailure("redis.del_failed", err);
  }
}

/** Removes all keys matching the pattern (e.g. `products:*`). A failure does not propagate. */
export async function redisDelPattern(pattern: string): Promise<void> {
  try {
    await withTimeout(
      (async () => {
        const keys: string[] = [];
        for await (const key of redis.scanIterator({
          MATCH: pattern,
          COUNT: 100,
        })) {
          keys.push(key);
        }
        if (keys.length > 0) {
          await redis.del(keys);
        }
      })(),
      SCAN_TIMEOUT_MS,
    );
  } catch (err) {
    warnRedisFailure("redis.del_pattern_failed", err);
  }
}
