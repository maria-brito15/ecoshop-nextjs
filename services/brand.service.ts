// services/brand.service.ts

/**
 * BRAND SERVICE
 *
 * Service layer for brand CRUD operations.
 *
 * Brands represent EcoShop's partner manufacturers/companies.
 * Each brand is associated with a user of type "MARCA" or "ADMIN".
 *
 * Relationships:
 * - 1:1 with Usuario (the user responsible for the brand)
 * - 1:N with Produto (a brand can have multiple products)
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
import { ResourceNotFound, BusinessConflict } from "@/lib/errors/dominio";
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
 * Includes summary data of the responsible user (id, nome, email).
 *
 * @returns Array of brands with the associated user's data
 */
export async function listBrands() {
  return withCache(brandsKey(), TTL.SHORT_LIST, () =>
    prisma.marca.findMany({
      orderBy: { nome: "asc" },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
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
    prisma.marca.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        produtos: true,
      },
    }),
  );
}

/**
 * Creates a new brand.
 * Requires ADMIN authentication.
 *
 * @param data - Brand data
 * @param data.nome - Brand name (e.g. "EcoBrand")
 * @param data.descricao - Optional brand description
 * @param data.usuarioId - ID of the responsible user (type MARCA or ADMIN)
 * @returns Newly created brand with the user's data
 *
 * @example
 * const brand = await createBrand({
 *   nome: "EcoBrand",
 *   descricao: "Sustainable clothing",
 *   usuarioId: 5
 * });
 *
 * @throws ResourceNotFound if usuarioId does not exist
 * @throws BusinessConflict if the user is neither MARCA nor ADMIN
 *   (REQ-REF-04; decision recorded in docs/capabilities/cadastros-de-referencia/spec.md)
 *
 * NOTE (ADR-0018): this path is used by the ADMIN in the panel, with the user
 * already of type MARCA/ADMIN — so the brand goes straight in as APPROVED, unlike
 * the request created by public registration (`createUser`), which
 * starts as PENDING.
 */
export async function createBrand(data: {
  nome: string;
  descricao?: string;
  usuarioId: number;
}) {
  const user = await prisma.usuario.findUnique({
    where: { id: data.usuarioId },
  });
  if (!user) {
    throw new ResourceNotFound("User");
  }
  if (user.tipo !== "MARCA" && user.tipo !== "ADMIN") {
    throw new BusinessConflict(
      "The user responsible for a brand must be of type MARCA or ADMIN",
    );
  }

  const brand = await prisma.marca.create({
    data: { ...data, status: "APROVADA" },
    include: { usuario: { select: { id: true, nome: true } } },
  });
  await invalidateCache("BRANDS");
  return brand;
}

/**
 * Approves a pending brand: sets `Marca.status` to APROVADA and grants
 * the MARCA type to the associated user, atomically.
 *
 * REQ-USR-03, ADR-0018.
 *
 * @param id - ID of the pending brand
 * @returns Approved brand with the user's data
 * @throws ResourceNotFound if the brand does not exist
 * @throws BusinessConflict if the brand is no longer PENDING
 */
export async function approveBrand(id: number) {
  const brand = await prisma.marca.findUnique({ where: { id } });
  if (!brand) {
    throw new ResourceNotFound("Brand");
  }
  if (brand.status !== "PENDENTE") {
    throw new BusinessConflict("This brand is no longer pending approval");
  }

  const approved = await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: brand.usuarioId },
      data: { tipo: "MARCA" },
    });
    return tx.marca.update({
      where: { id },
      data: { status: "APROVADA" },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });
  });

  await Promise.all([
    invalidateKey(brandKey(id)),
    invalidateCache("BRANDS"),
    invalidateKey(userKey(brand.usuarioId)),
    invalidateKey(currentUserKey(brand.usuarioId)),
    invalidateCache("USERS"),
  ]);

  return approved;
}

/**
 * Updates an existing brand.
 * Requires ADMIN authentication.
 *
 * NOTE: usuarioId CANNOT be changed after creation.
 * To transfer responsibility, an admin must create a new brand.
 *
 * @param id - ID of the brand to update
 * @param data - Update data (nome, descricao - both optional)
 * @returns Updated brand
 * @throws Error P2025 if the brand does not exist
 *
 * NOTE (REQ-PROD-02, NFR-CONS-01): also invalidates the product cache,
 * because the product listing and detail embed the brand name.
 * Without it, renaming the brand only showed up in products after the 2–3 min TTL.
 */
export async function updateBrand(
  id: number,
  data: { nome?: string; descricao?: string },
) {
  const brand = await prisma.marca.update({ where: { id }, data });
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
  const brand = await prisma.marca.findUnique({ where: { id } });
  if (!brand) {
    throw new ResourceNotFound("Brand");
  }

  await prisma.marca.delete({ where: { id } });
  await Promise.all([invalidateKey(brandKey(id)), invalidateCache("BRANDS")]);
  return true;
}
