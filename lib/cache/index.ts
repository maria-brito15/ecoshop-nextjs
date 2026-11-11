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
 * @param chave - Chave do cache
 * @param ttl - Validade em segundos
 * @param fetcher - Busca a fonte de verdade (banco)
 */
export async function comCache<T>(
  chave: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await provider.get<T>(chave);
  if (cached !== null) return cached;

  const pendente = emVoo.get(chave) as Promise<T> | undefined;
  if (pendente) return pendente;

  const busca = (async () => {
    const fresh = await fetcher();
    await provider.set(chave, fresh, ttl);
    return fresh;
  })().finally(() => emVoo.delete(chave));

  emVoo.set(chave, busca);
  return busca;
}

/**
 * Invalida todas as chaves de um recurso (ex.: "PRODUTOS" → `produtos:*`).
 */
export async function invalidarCache(
  recurso: keyof typeof PREFIX,
): Promise<void> {
  await provider.delPattern(`${PREFIX[recurso]}*`);
}

/** Invalida vários recursos em paralelo. */
export async function invalidarCaches(
  recursos: (keyof typeof PREFIX)[],
): Promise<void> {
  await Promise.all(recursos.map(invalidarCache));
}

/** Invalida uma chave específica. */
export const invalidarChave = (chave: string) => provider.del(chave);

export const redisDel = (chave: string) => provider.del(chave);

export * from "./ttl";
export * from "./keys";
export * from "./contracts";
