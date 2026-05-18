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
import {
  comCache,
  invalidarCache,
  invalidarChave,
  chaveCategorias,
  chaveCategoria,
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
export async function listarCategorias() {
  return comCache(chaveCategorias(), TTL.LISTA_CURTA, () =>
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
export async function buscarCategoria(id: number) {
  return comCache(chaveCategoria(id), TTL.ITEM, () =>
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
export async function criarCategoria(data: {
  nome: string;
  descricao?: string;
}) {
  const categoria = await prisma.categoria.create({ data });
  await invalidarCache("CATEGORIAS");
  return categoria;
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
 */
export async function atualizarCategoria(
  id: number,
  data: { nome?: string; descricao?: string },
) {
  const categoria = await prisma.categoria.update({ where: { id }, data });
  await Promise.all([
    invalidarChave(chaveCategoria(id)),
    invalidarCache("CATEGORIAS"),
  ]);
  return categoria;
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
export async function deletarCategoria(id: number) {
  // Verifica se categoria existe antes de tentar deletar
  const categoria = await prisma.categoria.findUnique({ where: { id } });
  if (!categoria) {
    throw new Error("P2025");
  }

  await prisma.categoria.delete({ where: { id } });
  await Promise.all([
    invalidarChave(chaveCategoria(id)),
    invalidarCache("CATEGORIAS"),
  ]);
  return true;
}
