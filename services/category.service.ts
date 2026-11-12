// services/category.service.ts

/**
 * CATEGORY SERVICE
 *
 * Service layer for category CRUD operations.
 *
 * Responsibilities:
 * - Encapsulate business logic related to categories
 * - Manage the cache (listings and individual items)
 * - Invalidate the cache automatically after mutations (create, update, delete)
 * - Handle Prisma-specific errors (e.g. P2025 - record not found)
 *
 * Cache strategy:
 * - SHORT_LIST (5 min) for complete listings
 * - ITEM (3 min) for individual categories
 * - Invalidation on write: all keys with the "categories:*" prefix
 *
 * @see lib/cache/keys.ts - Key generation functions
 * @see lib/cache/ttl.ts - TTL constants
 */

import { prisma } from "@/lib/db";
import { ResourceNotFound } from "@/lib/errors/domain";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  categoriesKey,
  categoryKey,
  TTL,
} from "@/lib/cache";

/**
 * Lists all categories ordered by name.
 * Public endpoint - any user can view.
 *
 * Cache: SHORT_LIST (5 minutes)
 * Key: "categories:list"
 *
 * @returns Array of categories ordered alphabetically by name
 *
 * @example
 * const categories = await listCategories();
 * // [{ id: 1, nome: "Organic Food", descricao: "..." }, ...]
 */
export async function listCategories() {
  return withCache(categoriesKey(), TTL.SHORT_LIST, () =>
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
  );
}

/**
 * Fetches a category by ID.
 * Public endpoint - any user can view.
 *
 * Cache: ITEM (3 minutes)
 * Key: "categories:{id}"
 *
 * @param id - Category ID
 * @returns The category, or null
 */
export async function getCategory(id: number) {
  return withCache(categoryKey(id), TTL.ITEM, () =>
    prisma.categoria.findUnique({ where: { id } }),
  );
}

/**
 * Creates a new category.
 * Requires ADMIN authentication.
 *
 * Cache invalidation:
 * - Removes all keys with the "categories:*" prefix
 * - Ensures listings and individual categories are reloaded
 *
 * @param data - Category data (nome, optional descricao)
 * @returns Newly created category
 *
 * @example
 * const category = await createCategory({
 *   nome: "Sustainable Electronics",
 *   descricao: "Devices with low energy consumption"
 * });
 */
export async function createCategory(data: {
  nome: string;
  descricao?: string;
}) {
  const category = await prisma.categoria.create({ data });
  await invalidateCache("CATEGORIES");
  return category;
}

/**
 * Updates an existing category.
 * Requires ADMIN authentication.
 *
 * Cache invalidation:
 * - Removes the category's individual key (categoryKey)
 * - Removes all listing keys ("categories:*" prefix)
 *
 * @param id - ID of the category to update
 * @param data - Update data (nome, descricao - both optional)
 * @returns Updated category
 * @throws Error P2025 if the category does not exist
 *
 * NOTE (REQ-PROD-02, NFR-CONS-01): also invalidates the product cache,
 * for the same reason as the brand (the category name is embedded in the
 * cached products).
 */
export async function updateCategory(
  id: number,
  data: { nome?: string; descricao?: string },
) {
  const category = await prisma.categoria.update({ where: { id }, data });
  await Promise.all([
    invalidateKey(categoryKey(id)),
    invalidateCache("CATEGORIES"),
    invalidateCache("PRODUCTS"),
  ]);
  return category;
}

/**
 * Deletes a category.
 * Requires ADMIN authentication.
 *
 * ATTENTION: Categories with associated products CANNOT be deleted
 * because of the foreign key constraint in the database (onDelete: restrict).
 * In that case, Prisma throws error P2003.
 *
 * Cache invalidation:
 * - Removes the category's individual key
 * - Removes all listing keys
 *
 * @param id - ID of the category to delete
 * @returns true if deleted successfully
 * @throws Error P2025 if the category does not exist
 * @throws Error P2003 if the category has linked products
 */
export async function deleteCategory(id: number) {
  // Check that the category exists before trying to delete it
  const category = await prisma.categoria.findUnique({ where: { id } });
  if (!category) {
    throw new ResourceNotFound("Category");
  }

  await prisma.categoria.delete({ where: { id } });
  await Promise.all([
    invalidateKey(categoryKey(id)),
    invalidateCache("CATEGORIES"),
  ]);
  return true;
}
