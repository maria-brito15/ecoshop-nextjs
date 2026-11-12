// lib/schemas/brand.ts

/**
 * BRAND SCHEMAS (Zod)
 *
 * Validation schemas for brand CRUD operations.
 *
 * Brands represent EcoShop's partner manufacturers/companies.
 * Examples: "EcoBrand", "Pure Naturals", "Bamboo Home".
 *
 * Business rules:
 * - The brand name is unique in the system
 * - Each brand is associated with one user (1:1 relationship)
 * - Only users of type BRAND or ADMIN can be responsible for brands
 *
 * Endpoints that use these schemas:
 * - POST /api/brands
 * - PUT /api/brands/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new brand.
 *
 * Rules:
 * - name: required, not empty (e.g. "EcoBrand")
 * - description: optional — the brand's story or commitments
 * - userId: required, positive integer (ID of the responsible user)
 *
 * ADDITIONAL VALIDATION (in the service):
 * - Check that the user exists
 * - Check that the user is not already associated with another brand (uniqueness)
 * - Check that the user's type is BRAND or ADMIN
 *
 * @example
 * const data = {
 *   name: "EcoBrand",
 *   description: "Sustainable clothing made with organic cotton",
 *   userId: 5
 * };
 */
export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  userId: z.number().int("User ID must be an integer"),
});

/**
 * Schema for updating an existing brand.
 *
 * ALL fields are optional — allows partial updates.
 * NOTE: userId CANNOT be changed after creation.
 * To transfer responsibility, an admin must create a new brand.
 *
 * Rules:
 * - name: minimum 1 character IF provided
 * - description: free string IF provided
 *
 * @example
 * // Rename a brand
 * const data = { name: "EcoBrand Sustainable" };
 *
 * // Update only the description
 * const data = { description: "New 2026 collection with recycled fabrics" };
 */
export const updateBrandSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().optional(),
});

// Inferred types for use in the services
export type BrandInput = z.infer<typeof brandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
