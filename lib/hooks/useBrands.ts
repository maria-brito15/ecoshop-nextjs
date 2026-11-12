// lib/hooks/useBrands.ts

/**
 * BRANDS HOOKS
 *
 * Collection of hooks for brand CRUD operations.
 *
 * Brands represent EcoShop's partner manufacturers/companies.
 * Each brand is associated with a user of type "BRAND" or "ADMIN".
 *
 * Permissions:
 * - GET (list/fetch): public
 * - POST, PUT, DELETE: requires ADMIN authentication
 *
 * Endpoints:
 * - List: GET /api/brands
 * - Fetch: GET /api/brands/:id
 * - Create: POST /api/brands (admin)
 * - Update: PUT /api/brands/:id (admin)
 * - Delete: DELETE /api/brands/:id (admin)
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListBrandsResponse,
  GetBrandResponse,
  CreateBrandBody,
  CreateBrandResponse,
  UpdateBrandBody,
  UpdateBrandResponse,
  ApproveBrandResponse,
  OkResponse,
} from "@/types/api";

/**
 * Lists all available brands.
 * Public endpoint — used in product filters.
 *
 * @returns Hook with the brand array, loading and error
 */
export function useListBrands() {
  return useFetch<ListBrandsResponse>("/api/brands");
}

/**
 * Fetches a specific brand by ID.
 *
 * @param id - Brand ID (if null, the hook does not run)
 * @returns Hook with the brand data
 */
export function useGetBrand(id: number | null) {
  return useFetch<GetBrandResponse>(id ? `/api/brands/${id}` : null);
}

/**
 * Creates a new brand.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for brand creation
 *
 * @example
 * const create = useCreateBrand();
 * await create.execute("/api/brands", {
 *   name: "EcoBrand",
 *   description: "Sustainable clothing",
 *   userId: 5 // ID of the responsible user (type BRAND)
 * });
 */
export function useCreateBrand() {
  return useMutation<CreateBrandResponse, CreateBrandBody>({
    method: "POST",
    invalidate: ["/api/brands"],
  });
}

/**
 * Updates an existing brand.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for brand update
 */
export function useUpdateBrand() {
  return useMutation<UpdateBrandResponse, UpdateBrandBody>({
    method: "PUT",
    invalidate: ["/api/brands"],
  });
}

/**
 * Deletes a brand.
 * Requires ADMIN authentication.
 *
 * ATTENTION: Brands with associated products may not be deleted
 * because of the foreign key constraint.
 *
 * @returns Mutation hook for brand deletion
 */
export function useDeleteBrand() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidate: ["/api/brands"],
  });
}

/**
 * Approves a pending brand.
 * Requires ADMIN authentication. REQ-USR-03, ADR-0018.
 *
 * @returns Mutation hook for brand approval
 *
 * @example
 * const approve = useApproveBrand();
 * await approve.execute(`/api/brands/${brand.id}/approve`);
 */
export function useApproveBrand() {
  return useMutation<ApproveBrandResponse>({
    method: "POST",
    invalidate: ["/api/brands"],
  });
}
