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
  ListCategoriesResponse,
  GetCategoryResponse,
  CreateCategoryBody,
  CreateCategoryResponse,
  UpdateCategoryBody,
  UpdateCategoryResponse,
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
export function useListCategories() {
  return useFetch<ListCategoriesResponse>("/api/categorias");
}

/**
 * Busca uma categoria específica pelo ID.
 *
 * @param id - ID da categoria (se null, hook não executa)
 * @returns Hook com dados da categoria
 */
export function useGetCategory(id: number | null) {
  return useFetch<GetCategoryResponse>(id ? `/api/categorias/${id}` : null);
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
export function useCreateCategory() {
  return useMutation<CreateCategoryResponse, CreateCategoryBody>({
    method: "POST",
    invalidate: ["/api/categorias"],
  });
}

/**
 * Atualiza uma categoria existente.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para atualização de categoria
 */
export function useUpdateCategory() {
  return useMutation<UpdateCategoryResponse, UpdateCategoryBody>({
    method: "PUT",
    invalidate: ["/api/categorias"],
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
export function useDeleteCategory() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidate: ["/api/categorias"],
  });
}
