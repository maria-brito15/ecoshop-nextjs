// lib/rate-limit.ts

/**
 * RATE LIMITING
 *
 * Limits attempts per identifier (IP, user) within a time window.
 *
 * - Counting in Redis, ATOMICALLY (REQ-OPS-15): `SET key 0 EX window NX`
 *   followed by `INCR` in a transaction. The TTL is born with the key; before, a
 *   separate `INCR` and `EXPIRE` left the key without expiry if the process
 *   died between the two, blocking the identifier forever.
 * - Without Redis (ADR-0020, owner's decision): uses an IN-MEMORY counter in the
 *   process itself. The limit applies per instance (with several instances, each
 *   counts separately) and is lost on restart — better than letting everything through.
 * - Client IP (REQ-OPS-16): `x-forwarded-for` is only trustworthy from the
 *   reverse proxy onward; the first value is written by the client and can be forged.
 *   The value at the position given by `TRUST_PROXY_HOPS` is used (default 1).
 */

import { redis, withTimeout, COMMAND_TIMEOUT_MS, warnRedisFailure } from "@/lib/redis";

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

/** Counts occurrences of a key within a window. */
export interface WindowCounter {
  /** Adds 1 to the key and returns the total in the current window. */
  increment(key: string, windowSeconds: number): Promise<number>;
}

class RedisCounter implements WindowCounter {
  async increment(key: string, windowSeconds: number): Promise<number> {
    const response = (await withTimeout(
      redis
        .multi()
        .set(key, 0, { EX: windowSeconds, NX: true })
        .incr(key)
        .exec(),
      COMMAND_TIMEOUT_MS,
    )) as unknown[];
    const total = Number(response[1]);
    if (!Number.isFinite(total)) throw new Error("unexpected Redis response");
    return total;
  }
}

/** Process-local counter (fallback when Redis fails). */
export class InMemoryCounter implements WindowCounter {
  private readonly entries = new Map<string, { total: number; expiraEm: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async increment(key: string, windowSeconds: number): Promise<number> {
    const t = this.now();
    this.purgeExpired(t);
    const current = this.entries.get(key);
    if (!current || current.expiraEm <= t) {
      this.entries.set(key, { total: 1, expiraEm: t + windowSeconds * 1000 });
      return 1;
    }
    current.total += 1;
    return current.total;
  }

  /** Only sweeps when the map grows, so the common case costs nothing. */
  private purgeExpired(t: number) {
    if (this.entries.size < 1000) return;
    for (const [key, e] of this.entries) if (e.expiraEm <= t) this.entries.delete(key);
  }
}

const redisCounter = new RedisCounter();
const localCounter = new InMemoryCounter();

/**
 * Records an attempt and reports whether the identifier went over the limit.
 *
 * @param counter - Main counter (default: Redis)
 * @param fallback - Used when the main one fails (default: local memory)
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
  counter: WindowCounter = redisCounter,
  fallback: WindowCounter = localCounter,
): Promise<{ blocked: boolean; remainingAttempts: number }> {
  const key = `rate_limit:${identifier}`;

  let attempts: number;
  try {
    attempts = await counter.increment(key, config.windowSeconds);
  } catch (err) {
    warnRedisFailure("rate_limit.redis_unavailable_using_memory", err);
    attempts = await fallback.increment(key, config.windowSeconds);
  }

  return {
    blocked: attempts > config.limit,
    remainingAttempts: Math.max(0, config.limit - attempts),
  };
}

/**
 * How many trusted proxies sit in front of the application (variable
 * `TRUST_PROXY_HOPS`; default 1: one reverse proxy, as in the publishing compose).
 */
function proxyHops(): number {
  const value = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  return Number.isInteger(value) && value >= 0 ? value : 1;
}

/**
 * Client IP for rate limiting.
 *
 * With N trusted proxies, the real IP is the Nth entry counted from the END of
 * `x-forwarded-for` (each proxy appends the one it saw); earlier entries come from
 * the client and can be forged. With 0 proxies the header is ignored (everyone
 * falls into the same "unknown" bucket: more restrictive, but not bypassable).
 */
export function getClientIp(
  req: Request,
  hops: number = proxyHops(),
): string {
  if (hops === 0) return "unknown";
  const entries = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (entries.length > 0) {
    return entries[Math.max(0, entries.length - hops)];
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
