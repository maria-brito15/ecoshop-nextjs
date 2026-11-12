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
 * - POST /api/categorias
 * - PUT /api/categorias/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new category.
 *
 * Rules:
 * - nome: required, not empty (automatic trim)
 * - descricao: optional (trimmed if provided)
 *
 * @example
 * const data = {
 *   nome: "Sustainable Electronics",
 *   descricao: "Devices with low energy consumption"
 * };
 */
export const categorySchema = z.object({
  nome: z.string().min(1, "Category name is required"),
  descricao: z.string().optional(),
});

/**
 * Schema for updating an existing category.
 *
 * ALL fields are optional — allows partial updates.
 * Useful for PATCH operations where only one field needs to change.
 *
 * Rules:
 * - nome: minimum 1 character IF provided
 * - descricao: free string IF provided
 *
 * @example
 * // Rename a category
 * const data = { nome: "Sustainable Fashion" };
 *
 * // Update only the description
 * const data = { descricao: "Ethical and eco-friendly clothing" };
 */
export const updateCategorySchema = z.object({
  nome: z.string().min(1, "Name cannot be empty").optional(),
  descricao: z.string().optional(),
});

// Inferred types for use in the services
export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
