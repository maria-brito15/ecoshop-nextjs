// lib/cache/index.ts

/**
 * ============================================================================
 * CACHE MODULE
 * ============================================================================
 * Interface unificada para operações de cache da aplicação.
 *
 * Este módulo exporta:
 * - comCache: função de alto nível para caching com fallback
 * - invalidarCache: invalidação por tipo de recurso (usando PREFIX)
 * - invalidarCaches: invalidação múltipla em paralelo
 * - invalidarChave: invalidação de chave específica
 *
 * Padrão de uso nos services:
 * ```ts
 * export async function listarProdutos() {
 *   return comCache(chaveProdutos(), TTL.LISTA_PRODUTOS, () =>
 *     prisma.produto.findMany()
 *   );
 * }
 *
 * export async function atualizarProduto(id, data) {
 *   const produto = await prisma.produto.update(...);
 *   await invalidarCache("PRODUTOS");
 *   return produto;
 * }
 * ```
 *
 * Estratégia de cache:
 * 1. Tenta buscar do cache
 * 2. Se existe e não expirou → retorna (cache hit)
 * 3. Se não existe → executa fetcher → armazena no cache (cache miss)
 * 4. Retorna o dado (sempre fresco no cache miss)
 * ============================================================================
 */

import { RedisCacheProvider } from "./redis-provider";
import { PREFIX } from "./keys";
import type { CacheProvider } from "./contracts";

// Instância singleton do provedor de cache.
// Usa Redis em produção, pode ser trocado para outro provedor no futuro.
const provider: CacheProvider = new RedisCacheProvider();

/**
 * Wrapper para caching de operações assíncronas.
 *
 * Algoritmo:
 * 1. Verifica cache com a chave fornecida
 * 2. Se cache hit → retorna o valor (fast path)
 * 3. Se cache miss → executa fetcher → armazena no cache → retorna valor
 *
 * @template T - Tipo do dado retornado
 * @param chave - Chave única no cache (use funções de keys.ts)
 * @param ttl - Tempo de vida em segundos (use constantes de ttl.ts)
 * @param fetcher - Função async que busca o dado (executada apenas em cache miss)
 * @returns Dado do cache ou do fetcher
 *
 * @example
 * const produtos = await comCache(
 *   chaveProdutos(params),
 *   TTL.LISTA_PRODUTOS,
 *   () => prisma.produto.findMany()
 * );
 */
export async function comCache<T>(
  chave: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Cache hit: retorna imediatamente
  const cached = await provider.get<T>(chave);
  if (cached !== null) return cached;

  // Cache miss: executa fetcher e armazena resultado
  const fresh = await fetcher();
  await provider.set(chave, fresh, ttl);
  return fresh;
}

/**
 * Invalida todos os caches de um tipo de recurso.
 *
 * Como funciona:
 * - Usa o prefixo do recurso (ex: "produtos:*")
 * - Remove todas as chaves que começam com esse prefixo
 *
 * @param recurso - Chave do PREFIX (ex: "PRODUTOS", "CATEGORIAS")
 *
 * @example
 * // Após criar/atualizar/deletar um produto
 * await invalidarCache("PRODUTOS"); // remove "produtos:123" e "produtos:page=1&size=12"
 */
export async function invalidarCache(
  recurso: keyof typeof PREFIX,
): Promise<void> {
  await provider.delPattern(`${PREFIX[recurso]}*`);
}

/**
 * Invalida múltiplos tipos de cache em paralelo.
 * Útil quando uma operação afeta várias entidades.
 *
 * @param recursos - Array de chaves do PREFIX
 *
 * @example
 * // Ao criar um produto que também cria uma nova categoria
 * await invalidarCaches(["PRODUTOS", "CATEGORIAS"]);
 */
export async function invalidarCaches(
  recursos: (keyof typeof PREFIX)[],
): Promise<void> {
  await Promise.all(recursos.map(invalidarCache));
}

/**
 * Invalida uma chave específica do cache.
 * Útil para invalidar um item individual sem limpar toda listagem.
 *
 * @param chave - Chave exata a ser removida
 *
 * @example
 * // Após atualizar um produto específico
 * await invalidarChave(chaveProduto(123));
 */
export const invalidarChave = (chave: string) => provider.del(chave);

/**
 * Alias para invalidarChave (compatibilidade com código legado).
 * @deprecated Use invalidarChave em vez de redisDel
 */
export const redisDel = (chave: string) => provider.del(chave);

// Re-exporta constantes e tipos para conveniência
export * from "./ttl";
export * from "./keys";
export * from "./contracts";
