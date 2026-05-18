// lib/cache/contracts.ts

/**
 * ============================================================================
 * CACHE CONTRACTS
 * ============================================================================
 * Este arquivo define a interface abstrata para provedores de cache.
 *
 * O padrão de interface (Contract/Interface) permite:
 * - Trocar a implementação de cache facilmente (Redis, Memcached, In-Memory)
 * - Testar com um mock de cache sem depender de Redis real
 * - Desacoplar a lógica de negócio da implementação concreta
 *
 * Implementações atuais:
 * - RedisCacheProvider (lib/cache/redis-provider.ts) → produção
 *
 * Possíveis extensões futuras:
 * - MemcachedCacheProvider
 * - InMemoryCacheProvider (para desenvolvimento/testes)
 * - CloudCacheProvider (AWS ElastiCache, GCP Memorystore)
 * ============================================================================
 */

/**
 * Contrato para provedores de cache.
 * Qualquer implementação de cache deve seguir esta interface.
 *
 * Operações suportadas:
 * - get: recuperar valor por chave
 * - set: armazenar valor com TTL
 * - del: remover chave específica
 * - delPattern: remover múltiplas chaves por padrão (glob pattern)
 */
export interface CacheProvider {
  /**
   * Recupera um valor do cache.
   *
   * @template T - Tipo esperado do valor armazenado
   * @param key - Chave única no cache
   * @returns Valor desserializado ou null se não existir/expirado
   *
   * @example
   * const usuario = await cache.get<Usuario>("usuario:1");
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Armazena um valor no cache com TTL.
   *
   * @param key - Chave única no cache
   * @param value - Valor a ser armazenado (serializado automaticamente)
   * @param ttlSeconds - Tempo de vida em segundos
   *
   * @example
   * await cache.set("usuario:1", usuario, 300); // expira em 5 minutos
   */
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;

  /**
   * Remove uma chave específica do cache.
   * Útil para invalidar cache após update/delete.
   *
   * @param key - Chave a ser removida
   *
   * @example
   * await cache.del("usuario:1");
   */
  del(key: string): Promise<void>;

  /**
   * Remove todas as chaves que correspondem a um padrão (glob).
   * Útil para invalidar caches relacionados (ex: todas as listagens de produtos).
   *
   @param pattern - Padrão glob (ex: "produtos:*", "categorias:*")
   *
   * @example
   * // Invalida todos os caches de produtos
   * await cache.delPattern("produtos:*");
   */
  delPattern(pattern: string): Promise<void>;
}
