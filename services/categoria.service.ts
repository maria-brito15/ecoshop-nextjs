// services/categoria.service.ts

/**
 * ============================================================================
 * CATEGORIA SERVICE
 * ============================================================================
 * Camada de serviço para operações CRUD de categorias.
 *
 * Responsabilidades:
 * - Encapsular lógica de negócio relacionada a categorias
 * - Gerenciar cache (listagens e itens individuais)
 * - Invalidar cache automaticamente após mutações (create, update, delete)
 * - Tratar erros específicos do Prisma (ex: P2025 - registro não encontrado)
 *
 * Cache strategy:
 * - LISTA_CURTA (5 min) para listagens completas
 * - ITEM (3 min) para categorias individuais
 * - Invalidação em write: todas as chaves com prefixo "categorias:*"
 *
 * @see lib/cache/keys.ts - Funções de geração de chaves
 * @see lib/cache/ttl.ts - Constantes de TTL
 * ============================================================================
 */

import { prisma } from "@/lib/db";
import { ResourceNotFound } from "@/lib/errors/dominio";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  categoriesKey,
  categoryKey,
  TTL,
} from "@/lib/cache";

/**
 * Lista todas as categorias ordenadas por nome.
 * Endpoint público - qualquer usuário pode visualizar.
 *
 * Cache: LISTA_CURTA (5 minutos)
 * Chave: "categorias:lista"
 *
 * @returns Array de categorias ordenadas alfabeticamente por nome
 *
 * @example
 * const categorias = await listarCategorias();
 * // [{ id: 1, nome: "Alimentos Orgânicos", descricao: "..." }, ...]
 */
export async function listCategories() {
  return withCache(categoriesKey(), TTL.SHORT_LIST, () =>
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
  );
}

/**
 * Busca uma categoria pelo ID.
 * Endpoint público - qualquer usuário pode visualizar.
 *
 * Cache: ITEM (3 minutos)
 * Chave: "categorias:{id}"
 *
 * @param id - ID da categoria
 * @returns Categoria encontrada ou null
 */
export async function getCategory(id: number) {
  return withCache(categoryKey(id), TTL.ITEM, () =>
    prisma.categoria.findUnique({ where: { id } }),
  );
}

/**
 * Cria uma nova categoria.
 * Requer autenticação ADMIN.
 *
 * Invalidação de cache:
 * - Remove todas as chaves com prefixo "categorias:*"
 * - Garante que listagens e categorias individuais sejam recarregadas
 *
 * @param data - Dados da categoria (nome, descrição opcional)
 * @returns Categoria recém-criada
 *
 * @example
 * const categoria = await criarCategoria({
 *   nome: "Eletrônicos Sustentáveis",
 *   descricao: "Dispositivos com baixo consumo energético"
 * });
 */
export async function createCategory(data: {
  nome: string;
  descricao?: string;
}) {
  const category = await prisma.categoria.create({ data });
  await invalidateCache("CATEGORIES");
  return category;
}

/**
 * Atualiza uma categoria existente.
 * Requer autenticação ADMIN.
 *
 * Invalidação de cache:
 * - Remove a chave individual da categoria (chaveCategoria)
 * - Remove todas as chaves de listagem (prefixo "categorias:*")
 *
 * @param id - ID da categoria a ser atualizada
 * @param data - Dados para atualização (nome, descrição - ambos opcionais)
 * @returns Categoria atualizada
 * @throws Error P2025 se categoria não existir
 *
 * NOTA (REQ-PROD-02, NFR-CONS-01): também invalida o cache de produtos,
 * pelo mesmo motivo da marca (o nome da categoria aparece embutido nos
 * produtos cacheados).
 */
export async function updateCategory(
  id: number,
  data: { nome?: string; descricao?: string },
) {
  const category = await prisma.categoria.update({ where: { id }, data });
  await Promise.all([
    invalidateKey(categoryKey(id)),
    invalidateCache("CATEGORIES"),
    invalidateCache("PRODUCTS"),
  ]);
  return category;
}

/**
 * Deleta uma categoria.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Categorias com produtos associados NÃO podem ser deletadas
 * devido à constraint de chave estrangeira no banco (onDelete: restrict).
 * Neste caso, o Prisma lançará erro P2003.
 *
 * Invalidação de cache:
 * - Remove a chave individual da categoria
 * - Remove todas as chaves de listagem
 *
 * @param id - ID da categoria a ser deletada
 * @returns true se deletado com sucesso
 * @throws Error P2025 se categoria não existir
 * @throws Error P2003 se categoria possui produtos vinculados
 */
export async function deleteCategory(id: number) {
  // Verifica se categoria existe antes de tentar deletar
  const category = await prisma.categoria.findUnique({ where: { id } });
  if (!category) {
    throw new ResourceNotFound("Categoria");
  }

  await prisma.categoria.delete({ where: { id } });
  await Promise.all([
    invalidateKey(categoryKey(id)),
    invalidateCache("CATEGORIES"),
  ]);
  return true;
}
