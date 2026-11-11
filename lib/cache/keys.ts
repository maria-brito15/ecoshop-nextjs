// lib/cache/keys.ts

/**
 * ============================================================================
 * CACHE KEYS
 * ============================================================================
 * Gerenciamento de chaves do cache para garantir consistência.
 *
 * Padrão de chave: {PREFIXO}{identificador}
 * Exemplo: "produtos:1" (produto específico)
 *          "produtos:page=1&size=12" (listagem paginada)
 *
 * Por que prefixos?
 * - Organização lógica no Redis
 * - Permite invalidação por padrão (ex: "produtos:*")
 * - Evita colisão de chaves entre diferentes entidades
 *
 * IMPORTANTE: Todas as funções de chave devem ser usadas consistentemente
 * em services e no módulo de cache para garantir invalidação correta.
 * ============================================================================
 */

/**
 * Prefixos para cada tipo de entidade no cache.
 * Usados para:
 * - Namespacing (separar caches por entidade)
 * - Invalidação em lote (delPattern com prefixo)
 *
 * @example
 * await redisDelPattern(`${PREFIX.PRODUTOS}*`); // remove todos os caches de produtos
 */
export const PREFIX = {
  PRODUCTS: "products:",
  CATEGORIES: "categories:",
  BRANDS: "brands:",
  CERTIFICATES: "certificates:",
  USERS: "users:",
  PHOTOS: "photos:",
} as const;

/**
 * Gera chave de cache para listagem paginada de produtos.
 * A chave inclui todos os parâmetros de query para distinguir diferentes filtros.
 *
 * REQ-CAT-10: a chave sai dos filtros JÁ VALIDADOS, em ordem fixa e só com os
 * parâmetros conhecidos. Antes usava `params.toString()` da URL crua: qualquer
 * `?x=...` ou outra ordem de parâmetros criava uma chave nova no Redis, e a
 * quantidade de chaves era controlada por quem chamava a API (público).
 *
 * @param filtros - Filtros validados (`listarProdutosQuerySchema`)
 * @returns Chave no formato "produtos:page=1&size=12&categoriaId=5&marcaId=&precoMax=&sort=relevancia&nome="
 */
export interface ProductFilters {
  page: number;
  size: number;
  categoriaId?: number;
  marcaId?: number;
  precoMax?: number;
  sort: string;
  nome?: string;
}

export function productListKey(filters: ProductFilters): string {
  // A busca por nome ignora a caixa; a chave também (mesma busca, mesma chave).
  const name = encodeURIComponent((filters.nome ?? "").trim().toLowerCase());
  return (
    `${PREFIX.PRODUCTS}page=${filters.page}&size=${filters.size}` +
    `&categoriaId=${filters.categoriaId ?? ""}&marcaId=${filters.marcaId ?? ""}` +
    `&precoMax=${filters.precoMax ?? ""}&sort=${filters.sort}&nome=${name}`
  );
}

/**
 * Gera chave de cache para um produto específico.
 *
 * @param id - ID do produto
 * @returns Chave no formato "produtos:123"
 */
export function productKey(id: number): string {
  return `${PREFIX.PRODUCTS}${id}`;
}

/**
 * Gera chave de cache para listagem de categorias.
 * Como a listagem é sempre a mesma (sem filtros), a chave é fixa.
 *
 * @returns Chave no formato "categorias:lista"
 */
export function categoriesKey(): string {
  return `${PREFIX.CATEGORIES}list`;
}

/**
 * Gera chave de cache para uma categoria específica.
 *
 * @param id - ID da categoria
 * @returns Chave no formato "categorias:123"
 */
export function categoryKey(id: number): string {
  return `${PREFIX.CATEGORIES}${id}`;
}

/**
 * Gera chave de cache para listagem de marcas.
 * A listagem é sempre completa (sem paginação/filtros).
 *
 * @returns Chave no formato "marcas:lista"
 */
export function brandsKey(): string {
  return `${PREFIX.BRANDS}list`;
}

/**
 * Gera chave de cache para uma marca específica.
 *
 * @param id - ID da marca
 * @returns Chave no formato "marcas:123"
 */
export function brandKey(id: number): string {
  return `${PREFIX.BRANDS}${id}`;
}

/**
 * Gera chave de cache para listagem de certificados.
 *
 * @returns Chave no formato "certificados:lista"
 */
export function certificatesKey(): string {
  return `${PREFIX.CERTIFICATES}list`;
}

/**
 * Gera chave de cache para um certificado específico.
 *
 * @param id - ID do certificado
 * @returns Chave no formato "certificados:123"
 */
export function certificateKey(id: number): string {
  return `${PREFIX.CERTIFICATES}${id}`;
}

/**
 * Gera chave de cache para o perfil do usuário autenticado ("me").
 * Inclui o ID do usuário para distinguir diferentes usuários.
 *
 * @param id - ID do usuário
 * @returns Chave no formato "usuarios:me:123"
 */
export function currentUserKey(id: number): string {
  return `${PREFIX.USERS}me:${id}`;
}

/**
 * Gera chave de cache para um usuário específico (dados públicos).
 *
 * @param id - ID do usuário
 * @returns Chave no formato "usuarios:123"
 */
export function userKey(id: number): string {
  return `${PREFIX.USERS}${id}`;
}

/**
 * Gera chave de cache para listagem de usuários (admin).
 * A listagem de usuários não tem paginação/filtros no momento.
 *
 * @returns Chave no formato "usuarios:lista"
 */
export function usersKey(): string {
  return `${PREFIX.USERS}list`;
}

/**
 * Gera chave de cache para listagem de fotos de um produto.
 *
 * @param productId - ID do produto
 * @returns Chave no formato "fotos:produto:123"
 */
export function productPhotosKey(productId: number): string {
  return `${PREFIX.PHOTOS}product:${productId}`;
}
