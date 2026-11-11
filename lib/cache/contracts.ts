// lib/cache/contracts.ts

/**
 * CACHE CONTRACTS
 *
 * Defines the abstract interface for cache providers.
 *
 * The interface (contract) pattern allows:
 * - Swapping the cache implementation easily (Redis, Memcached, in-memory)
 * - Testing with a cache mock without depending on a real Redis
 * - Decoupling business logic from the concrete implementation
 *
 * Current implementations:
 * - RedisCacheProvider (lib/cache/redis-provider.ts) → production
 *
 * Possible future extensions:
 * - MemcachedCacheProvider
 * - InMemoryCacheProvider (for development/tests)
 * - CloudCacheProvider (AWS ElastiCache, GCP Memorystore)
 */

/**
 * Contract for cache providers.
 * Any cache implementation must follow this interface.
 *
 * Supported operations:
 * - get: fetch a value by key
 * - set: store a value with a TTL
 * - del: remove a specific key
 * - delPattern: remove multiple keys by pattern (glob pattern)
 */
export interface CacheProvider {
  /**
   * Fetches a value from the cache.
   *
   * @template T - Expected type of the stored value
   * @param key - Unique cache key
   * @returns Deserialized value, or null if missing/expired
   *
   * @example
   * const user = await cache.get<User>("users:1");
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value in the cache with a TTL.
   *
   * @param key - Unique cache key
   * @param value - Value to store (serialized automatically)
   * @param ttlSeconds - Time to live in seconds
   *
   * @example
   * await cache.set("users:1", user, 300); // expires in 5 minutes
   */
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;

  /**
   * Removes a specific key from the cache.
   * Useful to invalidate the cache after an update/delete.
   *
   * @param key - Key to remove
   *
   * @example
   * await cache.del("users:1");
   */
  del(key: string): Promise<void>;

  /**
   * Removes all keys matching a pattern (glob).
   * Useful to invalidate related caches (e.g. all product listings).
   *
   * @param pattern - Glob pattern (e.g. "products:*", "categories:*")
   *
   * @example
   * // Invalidates all product caches
   * await cache.delPattern("products:*");
   */
  delPattern(pattern: string): Promise<void>;
}
