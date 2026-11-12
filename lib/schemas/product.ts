// lib/schemas/product.ts

/**
 * PRODUCT SCHEMAS (Zod)
 *
 * Validation schemas for product CRUD operations.
 *
 * Products are the core of the platform — they represent sustainable items for sale.
 *
 * Business rules:
 * - Price must be positive (greater than zero)
 * - Category and Brand are required (foreign keys)
 * - Name is required and must be unique (validated in the database via Prisma)
 *
 * Endpoints that use these schemas:
 * - POST /api/produtos
 * - PUT /api/produtos/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new product.
 *
 * Rules:
 * - nome: required, not empty
 * - descricao: optional, minimum 1 character if provided
 * - preco: required, positive number (greater than 0)
 * - categoriaId: required, positive integer
 * - marcaId: required, positive integer
 *
 * ADDITIONAL VALIDATIONS (in the service):
 * - Check that categoriaId exists in the database
 * - Check that marcaId exists in the database
 * - Check that the name is unique (no other product with the same name)
 *
 * @example
 * const data = {
 *   nome: "Organic Basic T-Shirt",
 *   descricao: "100% organic cotton, natural dyeing",
 *   preco: 89.90,
 *   categoriaId: 1,
 *   marcaId: 2
 * };
 */
export const productSchema = z.object({
  nome: z.string().min(1, "Product name is required"),
  descricao: z
    .string()
    .min(1, "Description must have at least 1 character")
    .optional(),
  preco: z.number().positive("Price must be greater than zero"),
  categoriaId: z.number().int("Category ID must be an integer"),
  marcaId: z.number().int("Brand ID must be an integer"),
});

/**
 * Schema for updating an existing product.
 *
 * ALL fields are optional — allows partial updates.
 * The admin can update only the fields they want.
 *
 * Rules (when present):
 * - nome: minimum 1 character
 * - descricao: minimum 1 character
 * - preco: positive (greater than 0)
 * - categoriaId: positive integer
 * - marcaId: positive integer
 * - certificadoIds: full list of linked certificates (REQ-PROD-05);
 *   replaces the current link — sending `[]` removes all certificates
 *
 * @example
 * // Raise the price by 10%
 * const data = { preco: 98.89 };
 *
 * // Update only the description
 * const data = { descricao: "Organic T-shirt with FSC certificate" };
 *
 * // Change the product's category
 * const data = { categoriaId: 3 };
 *
 * // Link two certificates (replaces the previous link)
 * const data = { certificadoIds: [1, 2] };
 */
export const updateProductSchema = z.object({
  nome: z.string().min(1, "Name cannot be empty").optional(),
  descricao: z.string().min(1, "Description cannot be empty").optional(),
  preco: z.number().positive("Price must be greater than zero").optional(),
  categoriaId: z
    .number()
    .int("Category ID must be an integer")
    .optional(),
  marcaId: z.number().int("Brand ID must be an integer").optional(),
  certificadoIds: z
    .array(z.number().int("Certificate ID must be an integer"))
    .optional(),
});

/**
 * Validation schema for the query parameters of GET /api/produtos.
 *
 * REQ-CAT-05: invalid page and size, or size above 100, respond 400
 * instead of being silently accepted (before, `Number(...)` of an invalid
 * value became NaN and went to Prisma unchecked).
 *
 * REQ-CAT-06/07: `marcaId` filters by brand; `precoMax` limits the price; `sort`
 * orders — all applied by the database (Prisma `where`/`orderBy`), so they
 * apply to the whole catalog, not just the returned page.
 *
 * Uses `coerce` because searchParams only delivers strings.
 */
export const listProductsQuerySchema = z.object({
  page: z.coerce
    .number({ message: "page must be a number" })
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .optional()
    .default(1),
  size: z.coerce
    .number({ message: "size must be a number" })
    .int("size must be an integer")
    .min(1, "size must be at least 1")
    .max(100, "size cannot exceed 100")
    .optional()
    .default(12),
  categoriaId: z.coerce
    .number()
    .int()
    .optional(),
  marcaId: z.coerce
    .number({ message: "marcaId must be a number" })
    .int("marcaId must be an integer")
    .optional(),
  precoMax: z.coerce
    .number({ message: "precoMax must be a number" })
    .positive("precoMax must be greater than zero")
    .optional(),
  sort: z
    .enum(["relevancia", "preco_asc", "preco_desc", "nome_asc", "nome_desc"], {
      message: "invalid sort",
    })
    .optional()
    .default("relevancia"),
  // REQ-CAT-10: size limit (the name search is part of the cache key);
  // empty text is equivalent to "no name filter".
  nome: z
    .string()
    .trim()
    .max(100, "nome cannot exceed 100 characters")
    .optional()
    .transform((value) => value || undefined),
});

// Inferred types for use in the services
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
