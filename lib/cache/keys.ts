// lib/cache/keys.ts

/**
 * CACHE KEYS
 *
 * Cache key management to guarantee consistency.
 *
 * Key pattern: {PREFIX}{identifier}
 * Example: "products:1" (a specific product)
 *          "products:page=1&size=12" (paginated listing)
 *
 * Why prefixes?
 * - Logical organization in Redis
 * - Allows pattern invalidation (e.g. "products:*")
 * - Avoids key collisions between different entities
 *
 * IMPORTANT: All key functions must be used consistently in services and in the
 * cache module to guarantee correct invalidation.
 */

/**
 * Prefixes for each entity type in the cache.
 * Used for:
 * - Namespacing (separating caches by entity)
 * - Batch invalidation (delPattern with a prefix)
 *
 * @example
 * await redisDelPattern(`${PREFIX.PRODUCTS}*`); // removes all product caches
 */
export const PREFIX = {
  PRODUCTS: "products:",
  CATEGORIES: "categories:",
  BRANDS: "brands:",
  CERTIFICATES: "certificates:",
  USERS: "users:",
  PHOTOS: "photos:",
} as const;

/**
 * Generates the cache key for the paginated product listing.
 * The key includes all query parameters to tell different filters apart.
 *
 * REQ-CAT-10: the key comes from the ALREADY VALIDATED filters, in a fixed order and
 * only with the known parameters. It used to use `params.toString()` of the raw URL:
 * any `?x=...` or a different parameter order created a new Redis key, and the
 * number of keys was controlled by whoever called the (public) API.
 *
 * @param filters - Validated filters (`listProductsQuerySchema`)
 * @returns Key in the format "products:page=1&size=12&categoriaId=5&marcaId=&precoMax=&sort=relevancia&nome="
 */
export interface ProductFilters {
  page: number;
  size: number;
  categoriaId?: number;
  marcaId?: number;
  precoMax?: number;
  sort: string;
  nome?: string;
}

export function productListKey(filters: ProductFilters): string {
  // Name search ignores case; the key does too (same search, same key).
  const name = encodeURIComponent((filters.nome ?? "").trim().toLowerCase());
  return (
    `${PREFIX.PRODUCTS}page=${filters.page}&size=${filters.size}` +
    `&categoriaId=${filters.categoriaId ?? ""}&marcaId=${filters.marcaId ?? ""}` +
    `&precoMax=${filters.precoMax ?? ""}&sort=${filters.sort}&nome=${name}`
  );
}

/**
 * Generates the cache key for a specific product.
 *
 * @param id - Product ID
 * @returns Key in the format "products:123"
 */
export function productKey(id: number): string {
  return `${PREFIX.PRODUCTS}${id}`;
}

/**
 * Generates the cache key for the category listing.
 * Since the listing is always the same (no filters), the key is fixed.
 *
 * @returns Key in the format "categories:list"
 */
export function categoriesKey(): string {
  return `${PREFIX.CATEGORIES}list`;
}

/**
 * Generates the cache key for a specific category.
 *
 * @param id - Category ID
 * @returns Key in the format "categories:123"
 */
export function categoryKey(id: number): string {
  return `${PREFIX.CATEGORIES}${id}`;
}

/**
 * Generates the cache key for the brand listing.
 * The listing is always complete (no pagination/filters).
 *
 * @returns Key in the format "brands:list"
 */
export function brandsKey(): string {
  return `${PREFIX.BRANDS}list`;
}

/**
 * Generates the cache key for a specific brand.
 *
 * @param id - Brand ID
 * @returns Key in the format "brands:123"
 */
export function brandKey(id: number): string {
  return `${PREFIX.BRANDS}${id}`;
}

/**
 * Generates the cache key for the certificate listing.
 *
 * @returns Key in the format "certificates:list"
 */
export function certificatesKey(): string {
  return `${PREFIX.CERTIFICATES}list`;
}

/**
 * Generates the cache key for a specific certificate.
 *
 * @param id - Certificate ID
 * @returns Key in the format "certificates:123"
 */
export function certificateKey(id: number): string {
  return `${PREFIX.CERTIFICATES}${id}`;
}

/**
 * Generates the cache key for the authenticated user's profile ("me").
 * Includes the user ID to tell different users apart.
 *
 * @param id - User ID
 * @returns Key in the format "users:me:123"
 */
export function currentUserKey(id: number): string {
  return `${PREFIX.USERS}me:${id}`;
}

/**
 * Generates the cache key for a specific user (public data).
 *
 * @param id - User ID
 * @returns Key in the format "users:123"
 */
export function userKey(id: number): string {
  return `${PREFIX.USERS}${id}`;
}

/**
 * Generates the cache key for the user listing (admin).
 * The user listing currently has no pagination/filters.
 *
 * @returns Key in the format "users:list"
 */
export function usersKey(): string {
  return `${PREFIX.USERS}list`;
}

/**
 * Generates the cache key for a product's photo listing.
 *
 * @param productId - Product ID
 * @returns Key in the format "photos:product:123"
 */
export function productPhotosKey(productId: number): string {
  return `${PREFIX.PHOTOS}product:${productId}`;
}
