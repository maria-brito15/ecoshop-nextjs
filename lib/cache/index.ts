// lib/cache/index.ts

/**
 * ============================================================================
 * CACHE MODULE
 * ============================================================================
 * Cache-aside sobre o Redis (ADR-0009), com invalidação por prefixo.
 *
 * REQ-OPS-17: acessos simultâneos à MESMA chave com cache vazio dividem uma
 * única chamada ao `fetcher` (single-flight), em vez de cada um ir ao banco
 * ("estouro de cache" quando uma chave popular expira). Vale por processo.
 * ============================================================================
 */

import { RedisCacheProvider } from "./redis-provider";
import { PREFIX } from "./keys";
import type { CacheProvider } from "./contracts";

const provider: CacheProvider = new RedisCacheProvider();

/** Buscas em andamento, por chave. */
const emVoo = new Map<string, Promise<unknown>>();

/**
 * Cache-aside: devolve do cache; no miss executa `fetcher`, grava e devolve.
 *
 * @param key - Chave do cache
 * @param ttl - Validade em segundos
 * @param fetcher - Busca a fonte de verdade (banco)
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await provider.get<T>(key);
  if (cached !== null) return cached;

  const pendente = emVoo.get(key) as Promise<T> | undefined;
  if (pendente) return pendente;

  const busca = (async () => {
    const fresh = await fetcher();
    await provider.set(key, fresh, ttl);
    return fresh;
  })().finally(() => emVoo.delete(key));

  emVoo.set(key, busca);
  return busca;
}

/**
 * Invalida todas as chaves de um recurso (ex.: "PRODUTOS" → `produtos:*`).
 */
export async function invalidateCache(
  recurso: keyof typeof PREFIX,
): Promise<void> {
  await provider.delPattern(`${PREFIX[recurso]}*`);
}

/** Invalida vários recursos em paralelo. */
export async function invalidateCaches(
  recursos: (keyof typeof PREFIX)[],
): Promise<void> {
  await Promise.all(recursos.map(invalidateCache));
}

/** Invalida uma chave específica. */
export const invalidateKey = (key: string) => provider.del(key);

export const redisDel = (key: string) => provider.del(key);

export * from "./ttl";
export * from "./keys";
export * from "./contracts";
