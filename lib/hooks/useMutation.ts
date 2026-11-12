// lib/hooks/useMutation.ts

/**
 * useMutation HOOK
 *
 * React hook for write operations on the API (POST, PUT, DELETE, PATCH).
 *
 * Features:
 * - Manages loading and error state
 * - Invalidates the cache automatically after success
 * - FormData support (file uploads)
 * - Compatible with any REST endpoint
 *
 * Difference from useFetch:
 * - useFetch: used for GET (reads)
 * - useMutation: used for POST/PUT/DELETE (writes)
 *
 * Usage pattern:
 * ```tsx
 * const createProduct = useMutation<Product, CreateProductBody>({
 *   method: "POST",
 *   invalidate: ["/api/products"] // invalidates the listing cache
 * });
 *
 * const handleSubmit = async (data) => {
 *   const result = await createProduct.execute("/api/products", data);
 *   if (result) router.push("/products");
 * };
 * ```
 */

"use client";

import { useState } from "react";
import { invalidateClientCache } from "./useFetch";

/**
 * Configuration options of the mutation hook.
 */
type Options = {
  /** HTTP method of the request (default: POST) */
  method?: "POST" | "PUT" | "DELETE" | "PATCH";
  /** Credentials mode (default: "include" to send cookies) */
  credentials?: RequestCredentials;
  /** URLs to invalidate in the client cache after success */
  invalidate?: string[];
};

/**
 * Expected error response format from the API.
 * Every route answers errors as { error }.
 */
type ApiErrorResponse = { error?: string };

/**
 * Hook for API mutation operations.
 *
 * @template TResponse - Type of the response data (success)
 * @template TBody - Type of the request body (an object or FormData)
 * @param options - Mutation configuration (method, invalidate, etc.)
 * @returns Mutation state + execute function
 *
 * @example
 * // DELETE without a body
 * const remove = useMutation<{ ok: boolean }>({ method: "DELETE" });
 * await remove.execute(`/api/products/${id}`);
 *
 * @example
 * // POST with FormData (file upload)
 * const upload = useMutation<Photo, FormData>({ method: "POST" });
 * const formData = new FormData();
 * formData.append("image", file);
 * await upload.execute("/api/photos", formData);
 */
export function useMutation<TResponse, TBody = unknown>(options?: Options) {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Runs the mutation.
   *
   * @param url - Endpoint URL
   * @param body - Request body (optional for DELETE)
   * @returns Response data, or null on error
   */
  async function execute(
    url: string,
    body?: TBody,
  ): Promise<TResponse | null> {
    setData(null);
    setLoading(true);
    setError(null);

    try {
      // Detect whether the body is FormData (file upload)
      // If so, do not set Content-Type (the browser sets multipart/form-data correctly)
      const isFormData = body instanceof FormData;

      const res = await fetch(url, {
        method: options?.method ?? "POST",
        credentials: options?.credentials ?? "include",
        headers: isFormData
          ? undefined
          : { "Content-Type": "application/json" },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      });

      const responseData = (await res.json()) as TResponse;

      if (!res.ok) {
        const errData = responseData as ApiErrorResponse;
        const message = errData.error ?? "Unknown error";
        setError(message);
        setLoading(false);
        return null;
      }

      setData(responseData);
      setLoading(false);

      // Invalidate client caches to force a refetch on the next useFetch
      // This guarantees the UI shows updated data after the mutation
      if (options?.invalidate) {
        options.invalidate.forEach(invalidateClientCache);
      }

      return responseData;
    } catch {
      setError("Connection failure");
      setLoading(false);
      return null;
    }
  }

  return { data, loading, error, execute };
}
