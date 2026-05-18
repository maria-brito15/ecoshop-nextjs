// lib/cache/redis-provider.ts

/**
 * ============================================================================
 * REDIS CACHE PROVIDER
 * ============================================================================
 * Implementação concreta do CacheProvider usando Redis como backend.
 *
 * Redis é escolhido por:
 * - Performance: operações em memória (sub-milissegundo)
 * - Persistência: dados sobrevivem a reinicializações (opcional)
 * - Expiração nativa: TTL via EXPIRE command
 * - Operações atômicas: INCR, DEL, etc.
 * - SCAN para invalidação por padrão (delPattern)
 *
 * Esta classe é um wrapper (Adapter Pattern) que converte as operações
 * genéricas do CacheProvider para as operações específicas do Redis.
 *
 * IMPORTANTE: Falhas de Redis são silenciadas nos métodos subjacentes
 * (redisGet, redisSet, etc.) para não quebrar a aplicação se Redis estiver off.
 * ============================================================================
 */

import { redisGet, redisSet, redisDel, redisDelPattern } from "@/lib/redis";
import type { CacheProvider } from "./contracts";

/**
 * Implementação do provedor de cache com Redis.
 *
 * Utiliza as funções helpers de lib/redis.ts que já tratam:
 * - Serialização/deserialização JSON
 * - Conexão e erros
 * - SCAN iterator para delPattern
 */
export class RedisCacheProvider implements CacheProvider {
  /**
   * Recupera um valor do Redis.
   *
   * @template T - Tipo esperado do valor
   * @param key - Chave no Redis
   * @returns Valor desserializado ou null
   */
  async get<T>(key: string): Promise<T | null> {
    return redisGet<T>(key);
  }

  /**
   * Armazena um valor no Redis com TTL.
   *
   * @param key - Chave no Redis
   * @param value - Valor a ser armazenado
   * @param ttlSeconds - Tempo de vida em segundos
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    return redisSet(key, value, ttlSeconds);
  }

  /**
   * Remove uma chave específica do Redis.
   *
   * @param key - Chave a ser removida
   */
  async del(key: string): Promise<void> {
    return redisDel(key);
  }

  /**
   * Remove todas as chaves que correspondem a um padrão glob.
   *
   * Implementação:
   * - Usa SCAN iterator para não bloquear o Redis (ao contrário de KEYS)
   * - Remove em lotes (COUNT 100) para performance
   *
   * @param pattern - Padrão glob (ex: "produtos:*")
   */
  async delPattern(pattern: string): Promise<void> {
    return redisDelPattern(pattern);
  }
}
