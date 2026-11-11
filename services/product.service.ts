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
 * - Certificates (via ProdutoCertificado, includes the full certificate)
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
  relevancia: { id: "asc" as const },
  preco_asc: { preco: "asc" as const },
  preco_desc: { preco: "desc" as const },
  nome_asc: { nome: "asc" as const },
  nome_desc: { nome: "desc" as const },
};

/**
 * Lists products with pagination and filters.
 *
 * Receives the ALREADY VALIDATED filters (`listProductsQuerySchema`; the defaults of
 * `page`, `size` and `sort` come from the schema, not from here):
 * - page: page number (default: 1)
 * - size: items per page (default: 12)
 * - categoriaId: filter by category
 * - marcaId: filter by brand (REQ-CAT-07)
 * - precoMax: maximum price (REQ-CAT-06)
 * - sort: relevancia (default) | preco_asc | preco_desc | nome_asc | nome_desc (REQ-CAT-06)
 * - nome: text search by name (case-insensitive, up to 100 characters)
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
  const { page, size, categoriaId: categoryId, marcaId: brandId, precoMax: maxPrice, sort, nome: name } = query;

  // The key comes from the validated filters (REQ-CAT-10), never from the raw URL.
  const key = productListKey(query);

  return withCache(key, TTL.PRODUCT_LIST, async () => {
    const where = {
      ...(categoryId !== undefined && { categoriaId: categoryId }),
      ...(brandId !== undefined && { marcaId: brandId }),
      ...(maxPrice !== undefined && { preco: { lte: maxPrice } }),
      ...(name && { nome: { contains: name, mode: "insensitive" as const } }),
    };

    const [products, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: {
          categoria: { select: { id: true, nome: true } },
          marca: { select: { id: true, nome: true } },
          certificados: { include: { certificado: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: ORDER_BY_SORT[sort],
      }),
      prisma.produto.count({ where }),
    ]);

    return { produtos: products, page, size, total };
  });
}

/**
 * Creates a new product.
 * Requires ADMIN authentication.
 *
 * @param data - Product data (nome, preco, categoriaId, marcaId, optional descricao)
 * @returns Newly created product with categories and brand included
 */
export async function createProduct(data: ProductInput) {
  const product = await prisma.produto.create({
    data,
    include: { categoria: true, marca: true },
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
    prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: true,
        marca: true,
        certificados: { include: { certificado: true } },
      },
    }),
  );
}

/**
 * Updates an existing product.
 * Requires ADMIN authentication.
 *
 * REQ-PROD-05: if `certificadoIds` is in the body, it fully replaces the
 * product↔certificate link (removes the old ones, creates the new ones, in a
 * transaction). Omitting the field does not change the existing link.
 *
 * @param id - ID of the product to update
 * @param data - Update data (all optional)
 * @returns Updated product with relationships
 * @throws Error P2025 if the product does not exist
 * @throws Error P2003 if any certificadoId does not exist
 */
export async function updateProduct(
  id: number,
  data: UpdateProductInput,
) {
  const { certificadoIds: certificateIds, ...productData } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (Object.keys(productData).length > 0) {
      await tx.produto.update({ where: { id }, data: productData });
    } else {
      await tx.produto.findUniqueOrThrow({ where: { id } });
    }

    if (certificateIds !== undefined) {
      await tx.produtoCertificado.deleteMany({ where: { produtoId: id } });
      const unique = [...new Set(certificateIds)];
      if (unique.length > 0) {
        await tx.produtoCertificado.createMany({
          data: unique.map((certificateId) => ({
            produtoId: id,
            certificadoId: certificateId,
          })),
        });
      }
    }

    return tx.produto.findUniqueOrThrow({
      where: { id },
      include: {
        categoria: true,
        marca: true,
        certificados: { include: { certificado: true } },
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
 * `produto_certificado` is `ON DELETE RESTRICT` (there is no cascade); the database refuses
 * (P2003) and the handler responds 409. To delete, unlink the
 * certificates first (`updateProduct` with `certificadoIds: []`).
 *
 * @param id - ID of the product to delete
 * @throws PrismaClientKnownRequestError P2025 if the product does not exist (404) or P2003 if there are links (409)
 */
export async function deleteProduct(id: number) {
  await prisma.produto.delete({ where: { id } });
  await Promise.all([
    invalidateKey(productKey(id)),
    invalidateCache("PRODUCTS"),
  ]);
}
