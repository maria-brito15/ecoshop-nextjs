// lib/schemas/category.ts

/**
 * CATEGORY SCHEMAS (Zod)
 *
 * Validation schemas for category CRUD operations.
 *
 * Categories organize products into groups such as:
 * - Sustainable Clothing
 * - Organic Food
 * - Natural Cosmetics
 * - Home and Decor
 * - Eco-Friendly Footwear
 *
 * Business rules:
 * - The category name is unique in the system (validated in the database via Prisma)
 * - The description is optional
 * - Categories with associated products cannot be deleted
 *
 * Endpoints that use these schemas:
 * - POST /api/categories
 * - PUT /api/categories/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new category.
 *
 * Rules:
 * - name: required, not empty (automatic trim)
 * - description: optional (trimmed if provided)
 *
 * @example
 * const data = {
 *   name: "Sustainable Electronics",
 *   description: "Devices with low energy consumption"
 * };
 */
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

/**
 * Schema for updating an existing category.
 *
 * ALL fields are optional — allows partial updates.
 * Useful for PATCH operations where only one field needs to change.
 *
 * Rules:
 * - name: minimum 1 character IF provided
 * - description: free string IF provided
 *
 * @example
 * // Rename a category
 * const data = { name: "Sustainable Fashion" };
 *
 * // Update only the description
 * const data = { description: "Ethical and eco-friendly clothing" };
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().optional(),
});

// Inferred types for use in the services
export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
