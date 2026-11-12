// lib/cache/ttl.ts

/**
 * CACHE TTL (TIME-TO-LIVE) CONSTANTS
 *
 * Time-to-live constants for the different kinds of cache.
 *
 * Why different TTLs?
 * - Static data (categories, brands, certificates): longer cache
 * - Product listings: medium cache (products change often)
 * - User data: short cache (the profile can be updated)
 * - Photos: medium cache (new photos can be added)
 *
 * Values in seconds.
 */

export const TTL = {
  /**
   * Cache for short listings (categories, brands, certificates).
   * 5 minutes = 300 seconds.
   *
   * Why 5 minutes?
   * - These entities change rarely (days or weeks)
   * - A long cache reduces database load
   * - 5 minutes is safe for data consistency
   */
  SHORT_LIST: 5 * 60, // 300 segundos

  /**
   * Cache for product listings (paginated + filters).
   * 2 minutes = 120 seconds.
   *
   * Why 2 minutes?
   * - Products change more often (prices, stock)
   * - Users expect to see changes relatively quickly
   * - 2 minutes balances performance and freshness
   */
  PRODUCT_LIST: 2 * 60, // 120 segundos

  /**
   * Cache for individual items (a specific product, category, brand).
   * 3 minutes = 180 seconds.
   *
   * Why 3 minutes?
   * - Detail views are more frequent than listings
   * - Slightly longer cache than listings
   * - Ensures price updates are visible within 3 minutes
   */
  ITEM: 3 * 60, // 180 segundos

  /**
   * Cache for user data (profile, session).
   * 1 minute = 60 seconds.
   *
   * Why 1 minute (shorter)?
   * - Users can update their profile (name, phone, password)
   * - Sensitive data must be refreshed quickly
   * - A short cache still reduces database load
   */
  USER: 60, // 60 segundos

  /**
   * Cache for product photo listings.
   * 2 minutes = 120 seconds.
   *
   * Why 2 minutes?
   * - Photos change rarely
   * - Uploading new photos invalidates the cache automatically
   * - Same TTL as product listings
   */
  PHOTOS: 2 * 60, // 120 segundos
} as const;
