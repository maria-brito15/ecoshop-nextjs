// lib/cache/redis-provider.ts

/**
 * REDIS CACHE PROVIDER
 *
 * Concrete CacheProvider implementation using Redis as the backend.
 *
 * Redis is chosen for:
 * - Performance: in-memory operations (sub-millisecond)
 * - Persistence: data survives restarts (optional)
 * - Native expiration: TTL via the EXPIRE command
 * - Atomic operations: INCR, DEL, etc.
 * - SCAN for pattern invalidation (delPattern)
 *
 * This class is a wrapper (Adapter pattern) that converts the generic CacheProvider
 * operations into Redis-specific ones.
 *
 * IMPORTANT: Redis failures are silenced in the underlying methods
 * (redisGet, redisSet, etc.) so the application does not break if Redis is off.
 */

import { redisGet, redisSet, redisDel, redisDelPattern } from "@/lib/redis";
import type { CacheProvider } from "./contracts";

/**
 * Cache provider implementation with Redis.
 *
 * Uses the helper functions in lib/redis.ts, which already handle:
 * - JSON serialization/deserialization
 * - Connection and errors
 * - SCAN iterator for delPattern
 */
export class RedisCacheProvider implements CacheProvider {
  /**
   * Fetches a value from Redis.
   *
   * @template T - Expected type of the value
   * @param key - Redis key
   * @returns Deserialized value or null
   */
  async get<T>(key: string): Promise<T | null> {
    return redisGet<T>(key);
  }

  /**
   * Stores a value in Redis with a TTL.
   *
   * @param key - Redis key
   * @param value - Value to store
   * @param ttlSeconds - Time to live in seconds
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    return redisSet(key, value, ttlSeconds);
  }

  /**
   * Removes a specific key from Redis.
   *
   * @param key - Key to remove
   */
  async del(key: string): Promise<void> {
    return redisDel(key);
  }

  /**
   * Removes all keys matching a glob pattern.
   *
   * Implementation:
   * - Uses a SCAN iterator so Redis is not blocked (unlike KEYS)
   * - Removes in batches (COUNT 100) for performance
   *
   * @param pattern - Glob pattern (e.g. "products:*")
   */
  async delPattern(pattern: string): Promise<void> {
    return redisDelPattern(pattern);
  }
}
