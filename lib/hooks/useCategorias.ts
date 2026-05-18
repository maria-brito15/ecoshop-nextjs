// lib/hooks/useCategorias.ts

/**
 * ============================================================================
 * CATEGORIAS HOOKS
 * ============================================================================
 * Coleção de hooks para operações CRUD de categorias.
 *
 * Categorias são usadas para:
 * - Filtrar produtos na listagem
 * - Organizar o catálogo por tipo (roupas, alimentos, cosméticos, etc.)
 * - Navegação no frontend
 *
 * Permissões:
 * - GET (listar/buscar): público (qualquer usuário pode ver)
 * - POST, PUT, DELETE: requer autenticação ADMIN
 *
 * Endpoints:
 * - Listagem: GET /api/categorias
 * - Busca: GET /api/categorias/:id
 * - Criar: POST /api/categorias (admin)
 * - Atualizar: PUT /api/categorias/:id (admin)
 * - Deletar: DELETE /api/categorias/:id (admin)
 * ============================================================================
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaCategoriasResponse,
  BuscarCategoriaResponse,
  CriarCategoriaBody,
  CriarCategoriaResponse,
  AtualizarCategoriaBody,
  AtualizarCategoriaResponse,
  OkResponse,
} from "@/types/api";

/**
 * Lista todas as categorias disponíveis.
 * Endpoint público — usado no menu de navegação e filtros.
 *
 * @returns Hook com array de categorias, loading e erro
 *
 * @example
 * const { data } = useListarCategorias();
 * const categorias = data?.categorias ?? [];
 */
export function useListarCategorias() {
  return useFetch<ListaCategoriasResponse>("/api/categorias");
}

/**
 * Busca uma categoria específica pelo ID.
 *
 * @param id - ID da categoria (se null, hook não executa)
 * @returns Hook com dados da categoria
 */
export function useBuscarCategoria(id: number | null) {
  return useFetch<BuscarCategoriaResponse>(id ? `/api/categorias/${id}` : null);
}

/**
 * Cria uma nova categoria.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para criação de categoria
 *
 * @example
 * const criar = useCriarCategoria();
 * await criar.executar("/api/categorias", {
 *   nome: "Eletrônicos Sustentáveis",
 *   descricao: "Produtos eletrônicos com baixo consumo energético"
 * });
 */
export function useCriarCategoria() {
  return useMutation<CriarCategoriaResponse, CriarCategoriaBody>({
    method: "POST",
    invalidar: ["/api/categorias"],
  });
}

/**
 * Atualiza uma categoria existente.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para atualização de categoria
 */
export function useAtualizarCategoria() {
  return useMutation<AtualizarCategoriaResponse, AtualizarCategoriaBody>({
    method: "PUT",
    invalidar: ["/api/categorias"],
  });
}

/**
 * Deleta uma categoria.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Categorias com produtos associados podem não ser deletadas
 * devido a constraint de chave estrangeira.
 *
 * @returns Mutation hook para deleção de categoria
 */
export function useDeletarCategoria() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidar: ["/api/categorias"],
  });
}
