// lib/hooks/useCategories.ts

/**
 * CATEGORIES HOOKS
 *
 * Collection of hooks for category CRUD operations.
 *
 * Categories are used to:
 * - Filter products in the listing
 * - Organize the catalog by type (clothing, food, cosmetics, etc.)
 * - Frontend navigation
 *
 * Permissions:
 * - GET (list/fetch): public (any user can see)
 * - POST, PUT, DELETE: requires ADMIN authentication
 *
 * Endpoints:
 * - List: GET /api/categories
 * - Fetch: GET /api/categories/:id
 * - Create: POST /api/categories (admin)
 * - Update: PUT /api/categories/:id (admin)
 * - Delete: DELETE /api/categories/:id (admin)
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListCategoriesResponse,
  GetCategoryResponse,
  CreateCategoryBody,
  CreateCategoryResponse,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  OkResponse,
} from "@/types/api";

/**
 * Lists all available categories.
 * Public endpoint — used in the navigation menu and filters.
 *
 * @returns Hook with the category array, loading and error
 *
 * @example
 * const { data } = useListCategories();
 * const categories = data?.categories ?? [];
 */
export function useListCategories() {
  return useFetch<ListCategoriesResponse>("/api/categories");
}

/**
 * Fetches a specific category by ID.
 *
 * @param id - Category ID (if null, the hook does not run)
 * @returns Hook with the category data
 */
export function useGetCategory(id: number | null) {
  return useFetch<GetCategoryResponse>(id ? `/api/categories/${id}` : null);
}

/**
 * Creates a new category.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for category creation
 *
 * @example
 * const create = useCreateCategory();
 * await create.execute("/api/categories", {
 *   name: "Sustainable Electronics",
 *   description: "Electronic products with low energy consumption"
 * });
 */
export function useCreateCategory() {
  return useMutation<CreateCategoryResponse, CreateCategoryBody>({
    method: "POST",
    invalidate: ["/api/categories"],
  });
}

/**
 * Updates an existing category.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for category update
 */
export function useUpdateCategory() {
  return useMutation<UpdateCategoryResponse, UpdateCategoryBody>({
    method: "PUT",
    invalidate: ["/api/categories"],
  });
}

/**
 * Deletes a category.
 * Requires ADMIN authentication.
 *
 * ATTENTION: Categories with associated products may not be deleted
 * because of the foreign key constraint.
 *
 * @returns Mutation hook for category deletion
 */
export function useDeleteCategory() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidate: ["/api/categories"],
  });
}
