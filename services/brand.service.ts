// services/brand.service.ts

/**
 * BRAND SERVICE
 *
 * Service layer for brand CRUD operations.
 *
 * Brands represent EcoShop's partner manufacturers/companies.
 * Each brand is associated with a user of type "BRAND" or "ADMIN".
 *
 * Relationships:
 * - 1:1 with User (the user responsible for the brand)
 * - 1:N with Product (a brand can have multiple products)
 *
 * Cache strategy:
 * - SHORT_LIST (5 min) for complete listings
 * - ITEM (3 min) for individual brands
 * - Invalidation on write: all keys with the "brands:*" prefix
 *
 * @see lib/cache/keys.ts - Key generation functions
 * @see lib/cache/ttl.ts - TTL constants
 */

import { prisma } from "@/lib/db";
import { ResourceNotFound, BusinessConflict } from "@/lib/errors/domain";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  brandsKey,
  brandKey,
  userKey,
  currentUserKey,
  TTL,
} from "@/lib/cache";

/**
 * Lists all brands ordered by name.
 * Public endpoint - users can see brands before buying.
 *
 * Cache: SHORT_LIST (5 minutes)
 * Key: "brands:list"
 *
 * Includes summary data of the responsible user (id, name, email).
 *
 * @returns Array of brands with the associated user's data
 */
export async function listBrands() {
  return withCache(brandsKey(), TTL.SHORT_LIST, () =>
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  );
}

/**
 * Fetches a brand by ID.
 *
 * Includes:
 * - Data of the responsible user
 * - The brand's product list
 *
 * @param id - Brand ID
 * @returns The brand with relationships, or null
 */
export async function getBrand(id: number) {
  return withCache(brandKey(id), TTL.ITEM, () =>
    prisma.brand.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        products: true,
      },
    }),
  );
}

/**
 * Creates a new brand.
 * Requires ADMIN authentication.
 *
 * @param data - Brand data
 * @param data.name - Brand name (e.g. "EcoBrand")
 * @param data.description - Optional brand description
 * @param data.userId - ID of the responsible user (type BRAND or ADMIN)
 * @returns Newly created brand with the user's data
 *
 * @example
 * const brand = await createBrand({
 *   name: "EcoBrand",
 *   description: "Sustainable clothing",
 *   userId: 5
 * });
 *
 * @throws ResourceNotFound if userId does not exist
 * @throws BusinessConflict if the user is neither BRAND nor ADMIN
 *   (REQ-REF-04; decision recorded in docs/capabilities/reference-data/spec.md)
 *
 * NOTE (ADR-0018): this path is used by the ADMIN in the panel, with the user
 * already of type BRAND/ADMIN — so the brand goes straight in as APPROVED, unlike
 * the request created by public registration (`createUser`), which
 * starts as PENDING.
 */
export async function createBrand(data: {
  name: string;
  description?: string;
  userId: number;
}) {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });
  if (!user) {
    throw new ResourceNotFound("User");
  }
  if (user.type !== "BRAND" && user.type !== "ADMIN") {
    throw new BusinessConflict(
      "The user responsible for a brand must be of type BRAND or ADMIN",
    );
  }

  const brand = await prisma.brand.create({
    data: { ...data, status: "APPROVED" },
    include: { user: { select: { id: true, name: true } } },
  });
  await invalidateCache("BRANDS");
  return brand;
}

/**
 * Approves a pending brand: sets `Brand.status` to APPROVED and grants
 * the BRAND type to the associated user, atomically.
 *
 * REQ-USR-03, ADR-0018.
 *
 * @param id - ID of the pending brand
 * @returns Approved brand with the user's data
 * @throws ResourceNotFound if the brand does not exist
 * @throws BusinessConflict if the brand is no longer PENDING
 */
export async function approveBrand(id: number) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) {
    throw new ResourceNotFound("Brand");
  }
  if (brand.status !== "PENDING") {
    throw new BusinessConflict("This brand is no longer pending approval");
  }

  const approved = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: brand.userId },
      data: { type: "BRAND" },
    });
    return tx.brand.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  });

  await Promise.all([
    invalidateKey(brandKey(id)),
    invalidateCache("BRANDS"),
    invalidateKey(userKey(brand.userId)),
    invalidateKey(currentUserKey(brand.userId)),
    invalidateCache("USERS"),
  ]);

  return approved;
}

/**
 * Updates an existing brand.
 * Requires ADMIN authentication.
 *
 * NOTE: userId CANNOT be changed after creation.
 * To transfer responsibility, an admin must create a new brand.
 *
 * @param id - ID of the brand to update
 * @param data - Update data (name, description - both optional)
 * @returns Updated brand
 * @throws Error P2025 if the brand does not exist
 *
 * NOTE (REQ-PROD-02, NFR-CONS-01): also invalidates the product cache,
 * because the product listing and detail embed the brand name.
 * Without it, renaming the brand only showed up in products after the 2–3 min TTL.
 */
export async function updateBrand(
  id: number,
  data: { name?: string; description?: string },
) {
  const brand = await prisma.brand.update({ where: { id }, data });
  await Promise.all([
    invalidateKey(brandKey(id)),
    invalidateCache("BRANDS"),
    invalidateCache("PRODUCTS"),
  ]);
  return brand;
}

/**
 * Deletes a brand.
 * Requires ADMIN authentication.
 *
 * ATTENTION: Brands with associated products CANNOT be deleted
 * because of the foreign key constraint in the database.
 *
 * @param id - ID of the brand to delete
 * @returns true if deleted successfully
 * @throws Error P2025 if the brand does not exist
 * @throws Error P2003 if the brand has linked products
 */
export async function deleteBrand(id: number) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) {
    throw new ResourceNotFound("Brand");
  }

  await prisma.brand.delete({ where: { id } });
  await Promise.all([invalidateKey(brandKey(id)), invalidateCache("BRANDS")]);
  return true;
}
