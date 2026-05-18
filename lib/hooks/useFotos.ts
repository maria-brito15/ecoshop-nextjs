// lib/hooks/useFotos.ts

/**
 * ============================================================================
 * FOTOS HOOKS
 * ============================================================================
 * Coleção de hooks para gerenciamento de fotos de produtos.
 *
 * As fotos são armazenadas no sistema de arquivos (public/data_fotos/)
 * e servidas como arquivos estáticos.
 *
 * Características:
 * - Upload via FormData (multipart/form-data)
 * - Validação de extensões e tamanho no backend
 * - Nomes sanitizados para evitar colisões (formato: {produtoId}_{timestamp}_{random}.ext)
 *
 * Endpoints:
 * - Listagem: GET /api/produtos/:id/fotos
 * - Upload: POST /api/produtos/:id/fotos (admin)
 * - Deleção: DELETE /api/produtos/:id/fotos?nome={nome} (admin)
 * ============================================================================
 */

"use client";

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type { Foto, FotosResponse } from "@/types/domain";

/**
 * Lista todas as fotos de um produto específico.
 *
 * @param produtoId - ID do produto (se 0 ou null, hook não executa)
 * @returns Hook com array de fotos, loading e erro
 *
 * @example
 * const { data, carregando } = useListarFotos(produtoId);
 * const fotos = data?.fotos ?? [];
 */
export function useListarFotos(produtoId: number) {
  return useFetch<FotosResponse>(`/api/produtos/${produtoId}/fotos`);
}

/**
 * Faz upload de uma nova foto para um produto.
 * Requer autenticação ADMIN.
 *
 * O corpo da requisição deve ser um FormData contendo:
 * - arquivo: File (a imagem)
 * - nome: string (opcional, nome personalizado)
 *
 * @param produtoId - ID do produto ao qual a foto será associada
 * @returns Mutation hook para upload de foto
 *
 * @example
 * const upload = useUploadFoto(produtoId);
 * const formData = new FormData();
 * formData.append("arquivo", file);
 * const result = await upload.executar(`/api/produtos/${produtoId}/fotos`, formData);
 */
export function useUploadFoto(produtoId: number) {
  return useMutation<{ ok: boolean; foto: Foto; mensagem: string }, FormData>({
    method: "POST",
    invalidar: [`/api/produtos/${produtoId}/fotos`],
  });
}

/**
 * Deleta uma foto específica de um produto.
 * Requer autenticação ADMIN.
 *
 * @param produtoId - ID do produto
 * @returns Mutation hook para deleção de foto
 *
 * @example
 * const deletar = useDeletarFoto(produtoId);
 * await deletar.executar(`/api/produtos/${produtoId}/fotos?nome=${nomeArquivo}`);
 */
export function useDeletarFoto(produtoId: number) {
  return useMutation<{ ok: boolean; mensagem: string }>({
    method: "DELETE",
    invalidar: [`/api/produtos/${produtoId}/fotos`],
  });
}
