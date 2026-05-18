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
  ListaProdutosResponse,
  BuscarProdutoResponse,
  CriarProdutoBody,
  CriarProdutoResponse,
  AtualizarProdutoBody,
  AtualizarProdutoResponse,
} from "@/types/api";

/**
 * Lista produtos com paginação e filtros.
 *
 * @param page - Número da página (1-indexado, padrão: 1)
 * @param size - Itens por página (padrão: 12)
 * @param categoriaId - Filtro opcional por categoria
 * @param nome - Busca textual por nome (case-insensitive)
 * @returns Hook com dados paginados, loading e erro
 *
 * @example
 * const { data, carregando } = useListarProdutos(1, 12, 5, "camiseta");
 * // data?.produtos = array de produtos
 * // data?.total = total de produtos que atendem aos filtros
 */
export function useListarProdutos(
  page = 1,
  size = 12,
  categoriaId?: number,
  nome?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (categoriaId) params.set("categoriaId", String(categoriaId));
  if (nome) params.set("nome", nome);

  return useFetch<ListaProdutosResponse>(`/api/produtos?${params}`);
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
export function useBuscarProduto(id: number | null) {
  return useFetch<BuscarProdutoResponse>(id ? `/api/produtos/${id}` : null);
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
export function useCriarProduto() {
  return useMutation<CriarProdutoResponse, CriarProdutoBody>({
    method: "POST",
    invalidar: ["/api/produtos"], // Invalida cache de listagens após criar
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
export function useAtualizarProduto() {
  return useMutation<AtualizarProdutoResponse, AtualizarProdutoBody>({
    method: "PUT",
    invalidar: ["/api/produtos"], // Invalida cache de listagens
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
export function useDeletarProduto() {
  return useMutation<{ ok: boolean }>({
    method: "DELETE",
    invalidar: ["/api/produtos"],
  });
}
