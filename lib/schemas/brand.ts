// lib/schemas/brand.ts

/**
 * BRAND SCHEMAS (Zod)
 *
 * Validation schemas for brand CRUD operations.
 *
 * Brands represent EcoShop's partner manufacturers/companies.
 * Examples: "EcoBrand", "Pureza Naturais", "Bambu Home".
 *
 * Business rules:
 * - The brand name is unique in the system
 * - Each brand is associated with one user (1:1 relationship)
 * - Only users of type MARCA or ADMIN can be responsible for brands
 *
 * Endpoints that use these schemas:
 * - POST /api/marcas
 * - PUT /api/marcas/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new brand.
 *
 * Rules:
 * - nome: required, not empty (e.g. "EcoBrand")
 * - descricao: optional — the brand's story or commitments
 * - usuarioId: required, positive integer (ID of the responsible user)
 *
 * ADDITIONAL VALIDATION (in the service):
 * - Check that the user exists
 * - Check that the user is not already associated with another brand (uniqueness)
 * - Check that the user's type is MARCA or ADMIN
 *
 * @example
 * const data = {
 *   nome: "EcoBrand",
 *   descricao: "Sustainable clothing made with organic cotton",
 *   usuarioId: 5
 * };
 */
export const brandSchema = z.object({
  nome: z.string().min(1, "Brand name is required"),
  descricao: z.string().optional(),
  usuarioId: z.number().int("User ID must be an integer"),
});

/**
 * Schema for updating an existing brand.
 *
 * ALL fields are optional — allows partial updates.
 * NOTE: usuarioId CANNOT be changed after creation.
 * To transfer responsibility, an admin must create a new brand.
 *
 * Rules:
 * - nome: minimum 1 character IF provided
 * - descricao: free string IF provided
 *
 * @example
 * // Rename a brand
 * const data = { nome: "EcoBrand Sustainable" };
 *
 * // Update only the description
 * const data = { descricao: "New 2026 collection with recycled fabrics" };
 */
export const updateBrandSchema = z.object({
  nome: z.string().min(1, "Name cannot be empty").optional(),
  descricao: z.string().optional(),
});

// Inferred types for use in the services
export type BrandInput = z.infer<typeof brandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
