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
 * - POST /api/products
 * - PUT /api/products/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new product.
 *
 * Rules:
 * - name: required, not empty
 * - description: optional, minimum 1 character if provided
 * - price: required, positive number (greater than 0)
 * - categoryId: required, positive integer
 * - brandId: required, positive integer
 *
 * ADDITIONAL VALIDATIONS (in the service):
 * - Check that categoryId exists in the database
 * - Check that brandId exists in the database
 * - Check that the name is unique (no other product with the same name)
 *
 * @example
 * const data = {
 *   name: "Organic Basic T-Shirt",
 *   description: "100% organic cotton, natural dyeing",
 *   price: 89.90,
 *   categoryId: 1,
 *   brandId: 2
 * };
 */
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z
    .string()
    .min(1, "Description must have at least 1 character")
    .optional(),
  price: z.number().positive("Price must be greater than zero"),
  categoryId: z.number().int("Category ID must be an integer"),
  brandId: z.number().int("Brand ID must be an integer"),
});

/**
 * Schema for updating an existing product.
 *
 * ALL fields are optional — allows partial updates.
 * The admin can update only the fields they want.
 *
 * Rules (when present):
 * - name: minimum 1 character
 * - description: minimum 1 character
 * - price: positive (greater than 0)
 * - categoryId: positive integer
 * - brandId: positive integer
 * - certificateIds: full list of linked certificates (REQ-PROD-05);
 *   replaces the current link — sending `[]` removes all certificates
 *
 * @example
 * // Raise the price by 10%
 * const data = { price: 98.89 };
 *
 * // Update only the description
 * const data = { description: "Organic T-shirt with FSC certificate" };
 *
 * // Change the product's category
 * const data = { categoryId: 3 };
 *
 * // Link two certificates (replaces the previous link)
 * const data = { certificateIds: [1, 2] };
 */
export const updateProductSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  price: z.number().positive("Price must be greater than zero").optional(),
  categoryId: z
    .number()
    .int("Category ID must be an integer")
    .optional(),
  brandId: z.number().int("Brand ID must be an integer").optional(),
  certificateIds: z
    .array(z.number().int("Certificate ID must be an integer"))
    .optional(),
});

/**
 * Validation schema for the query parameters of GET /api/products.
 *
 * REQ-CAT-05: invalid page and size, or size above 100, respond 400
 * instead of being silently accepted (before, `Number(...)` of an invalid
 * value became NaN and went to Prisma unchecked).
 *
 * REQ-CAT-06/07: `brandId` filters by brand; `maxPrice` limits the price; `sort`
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
  categoryId: z.coerce
    .number()
    .int()
    .optional(),
  brandId: z.coerce
    .number({ message: "brandId must be a number" })
    .int("brandId must be an integer")
    .optional(),
  maxPrice: z.coerce
    .number({ message: "maxPrice must be a number" })
    .positive("maxPrice must be greater than zero")
    .optional(),
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "name_asc", "name_desc"], {
      message: "invalid sort",
    })
    .optional()
    .default("relevance"),
  // REQ-CAT-10: size limit (the name search is part of the cache key);
  // empty text is equivalent to "no name filter".
  name: z
    .string()
    .trim()
    .max(100, "name cannot exceed 100 characters")
    .optional()
    .transform((value) => value || undefined),
});

// Inferred types for use in the services
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
