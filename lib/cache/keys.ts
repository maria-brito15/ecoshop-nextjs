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
  PRODUTOS: "produtos:",
  CATEGORIAS: "categorias:",
  MARCAS: "marcas:",
  CERTIFICADOS: "certificados:",
  USUARIOS: "usuarios:",
  FOTOS: "fotos:",
} as const;

/**
 * Gera chave de cache para listagem paginada de produtos.
 * A chave inclui todos os parâmetros de query para distinguir diferentes filtros.
 *
 * @param params - URLSearchParams com filtros (page, size, categoriaId, nome)
 * @returns Chave no formato "produtos:page=1&size=12&categoriaId=5"
 *
 * @example
 * const params = new URLSearchParams({ page: "1", size: "12", categoriaId: "5" });
 * const chave = chaveProdutos(params); // "produtos:page=1&size=12&categoriaId=5"
 */
export function chaveProdutos(params: URLSearchParams): string {
  return `${PREFIX.PRODUTOS}${params.toString()}`;
}

/**
 * Gera chave de cache para um produto específico.
 *
 * @param id - ID do produto
 * @returns Chave no formato "produtos:123"
 */
export function chaveProduto(id: number): string {
  return `${PREFIX.PRODUTOS}${id}`;
}

/**
 * Gera chave de cache para listagem de categorias.
 * Como a listagem é sempre a mesma (sem filtros), a chave é fixa.
 *
 * @returns Chave no formato "categorias:lista"
 */
export function chaveCategorias(): string {
  return `${PREFIX.CATEGORIAS}lista`;
}

/**
 * Gera chave de cache para uma categoria específica.
 *
 * @param id - ID da categoria
 * @returns Chave no formato "categorias:123"
 */
export function chaveCategoria(id: number): string {
  return `${PREFIX.CATEGORIAS}${id}`;
}

/**
 * Gera chave de cache para listagem de marcas.
 * A listagem é sempre completa (sem paginação/filtros).
 *
 * @returns Chave no formato "marcas:lista"
 */
export function chaveMarcas(): string {
  return `${PREFIX.MARCAS}lista`;
}

/**
 * Gera chave de cache para uma marca específica.
 *
 * @param id - ID da marca
 * @returns Chave no formato "marcas:123"
 */
export function chaveMarca(id: number): string {
  return `${PREFIX.MARCAS}${id}`;
}

/**
 * Gera chave de cache para listagem de certificados.
 *
 * @returns Chave no formato "certificados:lista"
 */
export function chaveCertificados(): string {
  return `${PREFIX.CERTIFICADOS}lista`;
}

/**
 * Gera chave de cache para um certificado específico.
 *
 * @param id - ID do certificado
 * @returns Chave no formato "certificados:123"
 */
export function chaveCertificado(id: number): string {
  return `${PREFIX.CERTIFICADOS}${id}`;
}

/**
 * Gera chave de cache para o perfil do usuário autenticado ("me").
 * Inclui o ID do usuário para distinguir diferentes usuários.
 *
 * @param id - ID do usuário
 * @returns Chave no formato "usuarios:me:123"
 */
export function chaveUsuarioMe(id: number): string {
  return `${PREFIX.USUARIOS}me:${id}`;
}

/**
 * Gera chave de cache para um usuário específico (dados públicos).
 *
 * @param id - ID do usuário
 * @returns Chave no formato "usuarios:123"
 */
export function chaveUsuario(id: number): string {
  return `${PREFIX.USUARIOS}${id}`;
}

/**
 * Gera chave de cache para listagem de usuários (admin).
 * A listagem de usuários não tem paginação/filtros no momento.
 *
 * @returns Chave no formato "usuarios:lista"
 */
export function chaveUsuarios(): string {
  return `${PREFIX.USUARIOS}lista`;
}

/**
 * Gera chave de cache para listagem de fotos de um produto.
 *
 * @param produtoId - ID do produto
 * @returns Chave no formato "fotos:produto:123"
 */
export function chaveFotosProduto(produtoId: number): string {
  return `${PREFIX.FOTOS}produto:${produtoId}`;
}
