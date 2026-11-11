// lib/hooks/useFetch.ts - FIXED VERSION (no logs)

/**
 * useFetch HOOK
 *
 * React hook for fetching data with automatic client-side caching.
 *
 * Features:
 * - In-memory cache with a 30-second TTL (avoids duplicate requests)
 * - Stale-while-revalidate: shows cached data while refreshing in the background
 * - SSR/hydration support (uses the initial cache if available)
 *
 * Why a client-side cache?
 * - Reduces network calls when navigating between pages
 * - Improves the user experience (data appears instantly)
 * - Data is revalidated in the background to stay consistent
 *
 * Usage pattern:
 * ```tsx
 * const { data, loading, error, execute } = useFetch<Product[]>("/api/produtos");
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage>{error}</ErrorMessage>;
 * return <ProductList products={data} />;
 * ```
 */

"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Internal state of the hook.
 * @template T - Type of the data returned by the API
 */
type State<T> = {
  /** Request data (null while loading or on error) */
  data: T | null;
  /** Whether the request is in progress */
  loading: boolean;
  /** Error message (null if there is no error) */
  error: string | null;
};

/**
 * Simple in-memory cache to avoid duplicate requests.
 * - Key: full request URL
 * - Value: data + expiration timestamp
 *
 * 30-second TTL: balance between fresh data and performance.
 * For data that changes often, use a smaller TTL or disable the cache.
 */
const memoryCache = new Map<string, { data: unknown; expiraEm: number }>();
const CLIENT_TTL_MS = 30_000; // 30 seconds (shorter than the server-side Redis cache)

/**
 * Gets data from the cache if it has not expired yet.
 * @template T - Type of the stored data
 * @param url - Request URL (cache key)
 * @returns Cached data or null
 */
function getCached<T>(url: string): T | null {
  const entry = memoryCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiraEm) {
    memoryCache.delete(url);
    return null;
  }
  return entry.data as T;
}

/**
 * Stores data in the cache with a fixed TTL.
 * @template T - Type of the stored data
 * @param url - Request URL (cache key)
 * @param data - Data to store
 */
function setCached<T>(url: string, data: T): void {
  memoryCache.set(url, { data, expiraEm: Date.now() + CLIENT_TTL_MS });
}

/**
 * Invalidates all cache entries whose URL contains a given prefix.
 * Used after mutations (POST/PUT/DELETE) to guarantee fresh data.
 *
 * @param prefix - URL prefix to invalidate (e.g. "/api/produtos")
 *
 * @example
 * // After creating a new product, invalidate all listing caches
 * invalidateClientCache("/api/produtos");
 */
/**
 * Empties the WHOLE client cache. Called on logout and when opening a new session:
 * the cache is per URL (not per user), so without this the next person using the
 * same tab would see the previous person's data for up to 30 s.
 */
export function clearClientCache(): void {
  memoryCache.clear();
}

export function invalidateClientCache(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) memoryCache.delete(key);
  }
}

/**
 * Hook to fetch API data with automatic caching.
 *
 * @template T - Type of the data returned by the API
 * @param url - Request URL (if null, the hook does not run)
 * @param options - Additional fetch options (headers, etc.)
 * @returns Request state + execute function for manual refetch
 *
 * Cache strategy:
 * 1. If a valid cache exists → show it instantly
 * 2. Fetch in the background to revalidate
 * 3. If the new data differs, update the UI
 *
 * @example
 * // Basic usage
 * const { data, loading, error } = useFetch<User>("/api/auth/me");
 *
 * @example
 * // With manual refetch
 * const { data, execute } = useFetch<Product>("/api/produtos");
 * const refresh = () => execute("/api/produtos?page=2");
 */
export function useFetch<T>(url: string | null, options?: RequestInit) {
  // Try to get data from the cache when the hook mounts
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const initialData = url ? getCached<T>(url) : null;
  const [state, setState] = useState<State<T>>({
    data: initialData,
    loading: !!url && initialData === null, // carrega se não tem cache
    error: null,
  });

  /**
   * Runs the request manually.
   * Useful to refetch after user actions.
   *
   * @param customUrl - Optional URL (overrides the hook's URL)
   * @returns Request data, or null on error
   */
  const execute = async (customUrl?: string): Promise<T | null> => {
    const urlToFetch = customUrl || url;
    if (!urlToFetch) return null;

    setState({ data: null, loading: true, error: null });

    try {
      const res = await fetch(urlToFetch, {
        credentials: "include", // envia cookie httpOnly com token JWT
        ...optionsRef.current,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as T;
      setCached(urlToFetch, data);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: message });
      return null;
    }
  };

  // Effect for automatic execution when the URL changes
  useEffect(() => {
    let active = true;
    if (!url) return;

    const cached = getCached<T>(url);

    // Case 1: a valid cache exists → show it and revalidate in the background
    if (cached !== null) {
      setState({ data: cached, loading: false, error: null });
      const controller = new AbortController();

      // Silent revalidation: update the cache if the data changed
      fetch(url, {
        credentials: "include",
        ...optionsRef.current,
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`error ${res.status}`);
          return res.json() as Promise<T>;
        })
        .then((fresh) => {
          setCached(url, fresh);
          // Only update the UI if the data really changed (avoids unnecessary re-render)
          if (active && JSON.stringify(fresh) !== JSON.stringify(cached)) {
            setState({ data: fresh, loading: false, error: null });
          }
        })
        .catch(() => {
          // Silencia erro na revalidação em background
          // O usuário já vê os dados do cache, então falha não é crítica
        });
      return () => {
        active = false;
        controller.abort(); // unmounted or the URL changed: cancel the revalidation
      };
    }

    // Case 2: no cache → make a normal request
    execute();

    return () => {
      active = false;
    };
    // `executar` e `options` ficam de fora de propósito: `options` costuma ser um
    // objeto literal novo a cada render (incluí-lo refaria a requisição sem parar);
    // a versão mais recente dele é lida por `optionsRef`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Re-executa se a URL mudar

  return { ...state, executar: execute };
}
