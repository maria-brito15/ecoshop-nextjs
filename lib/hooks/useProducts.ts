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
 * - List: GET /api/produtos (with pagination and filters)
 * - Fetch: GET /api/produtos/:id
 * - Create: POST /api/produtos (admin)
 * - Update: PUT /api/produtos/:id (admin)
 * - Delete: DELETE /api/produtos/:id (admin)
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
  | "relevancia"
  | "preco_asc"
  | "preco_desc"
  | "nome_asc"
  | "nome_desc";

/** Filtros adicionais de `useListProducts` (REQ-CAT-06/07), todos opcionais. */
export interface ListProductsFilters {
  marcaId?: number;
  precoMax?: number;
  sort?: ProductOrder;
}

/**
 * Lists products with pagination and filters.
 *
 * `marcaId`, `precoMax` and `sort` are applied by the server to the whole
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
 *   marcaId: 2,
 *   precoMax: 150,
 *   sort: "preco_asc",
 * });
 * // data?.produtos = array of products
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
  if (categoryId) params.set("categoriaId", String(categoryId));
  if (name) params.set("nome", name);
  if (filters?.marcaId) params.set("marcaId", String(filters.marcaId));
  if (filters?.precoMax) params.set("precoMax", String(filters.precoMax));
  if (filters?.sort) params.set("sort", filters.sort);

  return useFetch<ListProductsResponse>(`/api/produtos?${params}`);
}

/**
 * Fetches a specific product by ID.
 *
 * @param id - Product ID (if null, the hook does not run)
 * @returns Hook with the product data, loading and error
 *
 * @example
 * const { data } = useGetProduct(productId);
 * const product = data?.produto;
 */
export function useGetProduct(id: number | null) {
  return useFetch<GetProductResponse>(id ? `/api/produtos/${id}` : null);
}

/**
 * Creates a new product.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for product creation
 *
 * @example
 * const create = useCreateProduct();
 * await create.execute("/api/produtos", {
 *   nome: "Organic T-Shirt",
 *   preco: 89.90,
 *   categoriaId: 1,
 *   marcaId: 2
 * });
 */
export function useCreateProduct() {
  return useMutation<CreateProductResponse, CreateProductBody>({
    method: "POST",
    invalidate: ["/api/produtos"], // Invalida cache de listagens após criar
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
 * await update.execute(`/api/produtos/${id}`, {
 *   preco: 79.90 // partial update
 * });
 */
export function useUpdateProduct() {
  return useMutation<UpdateProductResponse, UpdateProductBody>({
    method: "PUT",
    invalidate: ["/api/produtos"], // Invalida cache de listagens
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
 * await remove.execute(`/api/produtos/${id}`);
 */
export function useDeleteProduct() {
  return useMutation<{ ok: boolean }>({
    method: "DELETE",
    invalidate: ["/api/produtos"],
  });
}
