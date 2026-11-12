// lib/hooks/useProducts.ts

/**
 * PRODUCTS HOOKS
 *
 * Collection of hooks for product CRUD operations.
 *
 * Each hook encapsulates:
 * - Endpoint URL
 * - HTTP method
 * - Cache invalidation after mutations
 *
 * Why specific hooks?
 * - Centralizes URLs (avoids strings scattered across the code)
 * - Guarantees consistent typing
 * - Easier refactoring (change an endpoint in a single place)
 *
 * Endpoints:
 * - List: GET /api/products (with pagination and filters)
 * - Fetch: GET /api/products/:id
 * - Create: POST /api/products (admin)
 * - Update: PUT /api/products/:id (admin)
 * - Delete: DELETE /api/products/:id (admin)
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListProductsResponse,
  GetProductResponse,
  CreateProductBody,
  CreateProductResponse,
  UpdateProductBody,
  UpdateProductResponse,
} from "@/types/api";

/** Orderings accepted by `useListProducts` (REQ-CAT-06). */
export type ProductOrder =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

/** Additional filters of `useListProducts` (REQ-CAT-06/07), all optional. */
export interface ListProductsFilters {
  brandId?: number;
  maxPrice?: number;
  sort?: ProductOrder;
}

/**
 * Lists products with pagination and filters.
 *
 * `brandId`, `maxPrice` and `sort` are applied by the server to the whole
 * catalog (not just the returned page) — REQ-CAT-06/07.
 *
 * @param page - Page number (1-indexed, default: 1)
 * @param size - Items per page (default: 12)
 * @param categoryId - Optional category filter
 * @param name - Text search by name (case-insensitive)
 * @param filters - Additional filters: brand, maximum price, ordering
 * @returns Hook with paginated data, loading and error
 *
 * @example
 * const { data, loading } = useListProducts(1, 12, 5, "t-shirt", {
 *   brandId: 2,
 *   maxPrice: 150,
 *   sort: "price_asc",
 * });
 * // data?.products = array of products
 * // data?.total = total products matching the filters
 */
export function useListProducts(
  page = 1,
  size = 12,
  categoryId?: number,
  name?: string,
  filters?: ListProductsFilters,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (categoryId) params.set("categoryId", String(categoryId));
  if (name) params.set("name", name);
  if (filters?.brandId) params.set("brandId", String(filters.brandId));
  if (filters?.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters?.sort) params.set("sort", filters.sort);

  return useFetch<ListProductsResponse>(`/api/products?${params}`);
}

/**
 * Fetches a specific product by ID.
 *
 * @param id - Product ID (if null, the hook does not run)
 * @returns Hook with the product data, loading and error
 *
 * @example
 * const { data } = useGetProduct(productId);
 * const product = data?.product;
 */
export function useGetProduct(id: number | null) {
  return useFetch<GetProductResponse>(id ? `/api/products/${id}` : null);
}

/**
 * Creates a new product.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for product creation
 *
 * @example
 * const create = useCreateProduct();
 * await create.execute("/api/products", {
 *   name: "Organic T-Shirt",
 *   price: 89.90,
 *   categoryId: 1,
 *   brandId: 2
 * });
 */
export function useCreateProduct() {
  return useMutation<CreateProductResponse, CreateProductBody>({
    method: "POST",
    invalidate: ["/api/products"], // Invalidates the listing cache after creating
  });
}

/**
 * Updates an existing product.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for product update
 *
 * @example
 * const update = useUpdateProduct();
 * await update.execute(`/api/products/${id}`, {
 *   price: 79.90 // partial update
 * });
 */
export function useUpdateProduct() {
  return useMutation<UpdateProductResponse, UpdateProductBody>({
    method: "PUT",
    invalidate: ["/api/products"], // Invalidates the listing cache
  });
}

/**
 * Deletes a product.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for product deletion
 *
 * @example
 * const remove = useDeleteProduct();
 * await remove.execute(`/api/products/${id}`);
 */
export function useDeleteProduct() {
  return useMutation<{ ok: boolean }>({
    method: "DELETE",
    invalidate: ["/api/products"],
  });
}
