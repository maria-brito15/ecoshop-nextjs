// services/product.service.ts

/**
 * PRODUCT SERVICE
 *
 * Service layer for product CRUD operations.
 *
 * Products are the core of the platform - they represent sustainable items for sale.
 *
 * Cache strategy:
 * - PRODUCT_LIST (2 min) for paginated listings
 * - ITEM (3 min) for individual products
 * - The listing key includes all query parameters
 * - Invalidation on write: all keys with the "products:*" prefix
 *
 * Included relationships:
 * - Category (full data)
 * - Brand (full data)
 * - Certificates (via ProductCertificate, includes the full certificate)
 *
 * @see lib/cache/keys.ts - Key generation functions
 * @see lib/cache/ttl.ts - TTL constants
 */

import { prisma } from "@/lib/db";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  productListKey,
  productKey,
  TTL,
} from "@/lib/cache";
import type {
  ListProductsQuery,
  ProductInput,
  UpdateProductInput,
} from "@/lib/schemas/product";

/**
 * Orderings accepted by `listProducts` (REQ-CAT-06).
 */
const ORDER_BY_SORT = {
  relevance: { id: "asc" as const },
  price_asc: { price: "asc" as const },
  price_desc: { price: "desc" as const },
  name_asc: { name: "asc" as const },
  name_desc: { name: "desc" as const },
};

/**
 * Lists products with pagination and filters.
 *
 * Receives the ALREADY VALIDATED filters (`listProductsQuerySchema`; the defaults of
 * `page`, `size` and `sort` come from the schema, not from here):
 * - page number (default: 1)
 * - size: items per page (default: 12)
 * - categoryId: filter by category
 * - brandId: filter by brand (REQ-CAT-07)
 * - maxPrice: maximum price (REQ-CAT-06)
 * - sort: relevance (default) | price_asc | price_desc | name_asc | name_desc (REQ-CAT-06)
 * - name: text search by name (case-insensitive, up to 100 characters)
 *
 * `where`/`orderBy` are resolved by Prisma (the database), not in memory —
 * so ordering and the price limit apply to the whole catalog,
 * not just to the items of the returned page (REQ-CAT-06).
 *
 * Cache: PRODUCT_LIST (2 minutes)
 * The key (REQ-CAT-10) comes from the validated filters, in a fixed order.
 *
 * @param query - Validated filters
 * @returns Paginated object with products, total, current page and size
 */
export async function listProducts(query: ListProductsQuery) {
  const { page, size, categoryId, brandId, maxPrice, sort, name } = query;

  // The key comes from the validated filters (REQ-CAT-10), never from the raw URL.
  const key = productListKey(query);

  return withCache(key, TTL.PRODUCT_LIST, async () => {
    const where = {
      ...(categoryId !== undefined && { categoryId }),
      ...(brandId !== undefined && { brandId }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(name && { name: { contains: name, mode: "insensitive" as const } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          certificates: { include: { certificate: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: ORDER_BY_SORT[sort],
      }),
      prisma.product.count({ where }),
    ]);

    return { products, page, size, total };
  });
}

/**
 * Creates a new product.
 * Requires ADMIN authentication.
 *
 * @param data - Product data (name, price, categoryId, brandId, optional description)
 * @returns Newly created product with categories and brand included
 */
export async function createProduct(data: ProductInput) {
  const product = await prisma.product.create({
    data,
    include: { category: true, brand: true },
  });

  await invalidateCache("PRODUCTS");
  return product;
}

/**
 * Fetches a product by ID.
 *
 * Includes:
 * - Category (full data)
 * - Brand (full data)
 * - Certificates (with the full certificate data)
 *
 * @param id - Product ID
 * @returns The product with relationships, or null
 */
export async function getProduct(id: number) {
  return withCache(productKey(id), TTL.ITEM, () =>
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        certificates: { include: { certificate: true } },
      },
    }),
  );
}

/**
 * Updates an existing product.
 * Requires ADMIN authentication.
 *
 * REQ-PROD-05: if `certificateIds` is in the body, it fully replaces the
 * product↔certificate link (removes the old ones, creates the new ones, in a
 * transaction). Omitting the field does not change the existing link.
 *
 * @param id - ID of the product to update
 * @param data - Update data (all optional)
 * @returns Updated product with relationships
 * @throws Error P2025 if the product does not exist
 * @throws Error P2003 if any certificateId does not exist
 */
export async function updateProduct(
  id: number,
  data: UpdateProductInput,
) {
  const { certificateIds, ...productData } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (Object.keys(productData).length > 0) {
      await tx.product.update({ where: { id }, data: productData });
    } else {
      await tx.product.findUniqueOrThrow({ where: { id } });
    }

    if (certificateIds !== undefined) {
      await tx.productCertificate.deleteMany({ where: { productId: id } });
      const unique = [...new Set(certificateIds)];
      if (unique.length > 0) {
        await tx.productCertificate.createMany({
          data: unique.map((certificateId) => ({
            productId: id,
            certificateId,
          })),
        });
      }
    }

    return tx.product.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        brand: true,
        certificates: { include: { certificate: true } },
      },
    });
  });

  await Promise.all([
    invalidateKey(productKey(id)),
    invalidateCache("PRODUCTS"),
  ]);
  return product;
}

/**
 * Deletes a product.
 * Requires ADMIN authentication.
 *
 * REQ-PROD-07: a product with linked certificates CANNOT be deleted
 * (owner's decision, 2026-11-11: block). The foreign key of
 * `product_certificates` is `ON DELETE RESTRICT` (there is no cascade); the database refuses
 * (P2003) and the handler responds 409. To delete, unlink the
 * certificates first (`updateProduct` with `certificateIds: []`).
 *
 * @param id - ID of the product to delete
 * @throws PrismaClientKnownRequestError P2025 if the product does not exist (404) or P2003 if there are links (409)
 */
export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
  await Promise.all([
    invalidateKey(productKey(id)),
    invalidateCache("PRODUCTS"),
  ]);
}
