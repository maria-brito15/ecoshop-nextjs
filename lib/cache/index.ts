// lib/cache/index.ts

/**
 * CACHE MODULE
 *
 * Cache-aside on top of Redis (ADR-0009), with prefix invalidation.
 *
 * REQ-OPS-17: simultaneous accesses to the SAME key with an empty cache share a
 * single call to the `fetcher` (single-flight), instead of each one hitting the
 * database ("cache stampede" when a popular key expires). Applies per process.
 */

import { RedisCacheProvider } from "./redis-provider";
import { PREFIX } from "./keys";
import type { CacheProvider } from "./contracts";

const provider: CacheProvider = new RedisCacheProvider();

/** In-flight fetches, by key. */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Cache-aside: returns from the cache; on a miss runs `fetcher`, stores and returns.
 *
 * @param key - Cache key
 * @param ttl - Validity in seconds
 * @param fetcher - Fetches the source of truth (database)
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await provider.get<T>(key);
  if (cached !== null) return cached;

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const search = (async () => {
    const fresh = await fetcher();
    await provider.set(key, fresh, ttl);
    return fresh;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, search);
  return search;
}

/**
 * Invalidates every key of a resource (e.g. "PRODUCTS" → `products:*`).
 */
export async function invalidateCache(
  resource: keyof typeof PREFIX,
): Promise<void> {
  await provider.delPattern(`${PREFIX[resource]}*`);
}

/** Invalidates several resources in parallel. */
export async function invalidateCaches(
  resources: (keyof typeof PREFIX)[],
): Promise<void> {
  await Promise.all(resources.map(invalidateCache));
}

/** Invalidates a specific key. */
export const invalidateKey = (key: string) => provider.del(key);

export const redisDel = (key: string) => provider.del(key);

export * from "./ttl";
export * from "./keys";
export * from "./contracts";
