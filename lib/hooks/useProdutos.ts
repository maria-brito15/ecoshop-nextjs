// lib/hooks/useProdutos.ts

/**
 * ============================================================================
 * PRODUTOS HOOKS
 * ============================================================================
 * Coleção de hooks para operações CRUD de produtos.
 *
 * Cada hook encapsula:
 * - URL do endpoint
 * - Método HTTP
 * - Invalidação de cache após mutations
 *
 * Por que hooks específicos?
 * - Centraliza URLs (evita strings espalhadas pelo código)
 * - Garante tipagem consistente
 * - Facilita refatoração (mudar endpoint em um único lugar)
 *
 * Endpoints:
 * - Listagem: GET /api/produtos (com paginação e filtros)
 * - Busca: GET /api/produtos/:id
 * - Criar: POST /api/produtos (admin)
 * - Atualizar: PUT /api/produtos/:id (admin)
 * - Deletar: DELETE /api/produtos/:id (admin)
 * ============================================================================
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListProductsResponse,
  GetProductResponse,
  CreateProductBody,
  CreateProductResponse,
  UpdateProductBody,
  UpdateProductResponse,
} from "@/types/api";

/** Ordenações aceitas por `useListarProdutos` (REQ-CAT-06). */
export type OrdemProdutos =
  | "relevancia"
  | "preco_asc"
  | "preco_desc"
  | "nome_asc"
  | "nome_desc";

/** Filtros adicionais de `useListarProdutos` (REQ-CAT-06/07), todos opcionais. */
export interface ListProductsFilters {
  marcaId?: number;
  precoMax?: number;
  sort?: OrdemProdutos;
}

/**
 * Lista produtos com paginação e filtros.
 *
 * `marcaId`, `precoMax` e `sort` são aplicados pelo servidor ao catálogo
 * inteiro (não só à página devolvida) — REQ-CAT-06/07.
 *
 * @param page - Número da página (1-indexado, padrão: 1)
 * @param size - Itens por página (padrão: 12)
 * @param categoryId - Filtro opcional por categoria
 * @param name - Busca textual por nome (case-insensitive)
 * @param filters - Filtros adicionais: marca, preço máximo, ordenação
 * @returns Hook com dados paginados, loading e erro
 *
 * @example
 * const { data, carregando } = useListarProdutos(1, 12, 5, "camiseta", {
 *   marcaId: 2,
 *   precoMax: 150,
 *   sort: "preco_asc",
 * });
 * // data?.produtos = array de produtos
 * // data?.total = total de produtos que atendem aos filtros
 */
export function useListProducts(
  page = 1,
  size = 12,
  categoryId?: number,
  name?: string,
  filters?: ListProductsFilters,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (categoryId) params.set("categoriaId", String(categoryId));
  if (name) params.set("nome", name);
  if (filters?.marcaId) params.set("marcaId", String(filters.marcaId));
  if (filters?.precoMax) params.set("precoMax", String(filters.precoMax));
  if (filters?.sort) params.set("sort", filters.sort);

  return useFetch<ListProductsResponse>(`/api/produtos?${params}`);
}

/**
 * Busca um produto específico pelo ID.
 *
 * @param id - ID do produto (se null, hook não executa)
 * @returns Hook com dados do produto, loading e erro
 *
 * @example
 * const { data } = useBuscarProduto(produtoId);
 * const produto = data?.produto;
 */
export function useGetProduct(id: number | null) {
  return useFetch<GetProductResponse>(id ? `/api/produtos/${id}` : null);
}

/**
 * Cria um novo produto.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para criação de produto
 *
 * @example
 * const criar = useCriarProduto();
 * await criar.executar("/api/produtos", {
 *   nome: "Camiseta Orgânica",
 *   preco: 89.90,
 *   categoriaId: 1,
 *   marcaId: 2
 * });
 */
export function useCreateProduct() {
  return useMutation<CreateProductResponse, CreateProductBody>({
    method: "POST",
    invalidate: ["/api/produtos"], // Invalida cache de listagens após criar
  });
}

/**
 * Atualiza um produto existente.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para atualização de produto
 *
 * @example
 * const atualizar = useAtualizarProduto();
 * await atualizar.executar(`/api/produtos/${id}`, {
 *   preco: 79.90 // atualização parcial
 * });
 */
export function useUpdateProduct() {
  return useMutation<UpdateProductResponse, UpdateProductBody>({
    method: "PUT",
    invalidate: ["/api/produtos"], // Invalida cache de listagens
  });
}

/**
 * Deleta um produto.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para deleção de produto
 *
 * @example
 * const deletar = useDeletarProduto();
 * await deletar.executar(`/api/produtos/${id}`);
 */
export function useDeleteProduct() {
  return useMutation<{ ok: boolean }>({
    method: "DELETE",
    invalidate: ["/api/produtos"],
  });
}
