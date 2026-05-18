// lib/hooks/useMarcas.ts

/**
 * ============================================================================
 * MARCAS HOOKS
 * ============================================================================
 * Coleção de hooks para operações CRUD de marcas.
 *
 * Marcas representam fabricantes/empresas parceiras da EcoShop.
 * Cada marca está associada a um usuário do tipo "MARCA" ou "ADMIN".
 *
 * Permissões:
 * - GET (listar/buscar): público
 * - POST, PUT, DELETE: requer autenticação ADMIN
 *
 * Endpoints:
 * - Listagem: GET /api/marcas
 * - Busca: GET /api/marcas/:id
 * - Criar: POST /api/marcas (admin)
 * - Atualizar: PUT /api/marcas/:id (admin)
 * - Deletar: DELETE /api/marcas/:id (admin)
 * ============================================================================
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaMarcasResponse,
  BuscarMarcaResponse,
  CriarMarcaBody,
  CriarMarcaResponse,
  AtualizarMarcaBody,
  AtualizarMarcaResponse,
  OkResponse,
} from "@/types/api";

/**
 * Lista todas as marcas disponíveis.
 * Endpoint público — usado em filtros de produtos.
 *
 * @returns Hook com array de marcas, loading e erro
 */
export function useListarMarcas() {
  return useFetch<ListaMarcasResponse>("/api/marcas");
}

/**
 * Busca uma marca específica pelo ID.
 *
 * @param id - ID da marca (se null, hook não executa)
 * @returns Hook com dados da marca
 */
export function useBuscarMarca(id: number | null) {
  return useFetch<BuscarMarcaResponse>(id ? `/api/marcas/${id}` : null);
}

/**
 * Cria uma nova marca.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para criação de marca
 *
 * @example
 * const criar = useCriarMarca();
 * await criar.executar("/api/marcas", {
 *   nome: "EcoBrand",
 *   descricao: "Roupas sustentáveis",
 *   usuarioId: 5 // ID do usuário responsável (tipo MARCA)
 * });
 */
export function useCriarMarca() {
  return useMutation<CriarMarcaResponse, CriarMarcaBody>({
    method: "POST",
    invalidar: ["/api/marcas"],
  });
}

/**
 * Atualiza uma marca existente.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para atualização de marca
 */
export function useAtualizarMarca() {
  return useMutation<AtualizarMarcaResponse, AtualizarMarcaBody>({
    method: "PUT",
    invalidar: ["/api/marcas"],
  });
}

/**
 * Deleta uma marca.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Marcas com produtos associados podem não ser deletadas
 * devido a constraint de chave estrangeira.
 *
 * @returns Mutation hook para deleção de marca
 */
export function useDeletarMarca() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidar: ["/api/marcas"],
  });
}
