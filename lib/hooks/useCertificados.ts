// lib/hooks/useCertificados.ts

/**
 * ============================================================================
 * CERTIFICADOS HOOKS
 * ============================================================================
 * Coleção de hooks para operações CRUD de certificados de sustentabilidade.
 *
 * Certificados atestam que um produto atende a padrões ambientais rigorosos.
 * Exemplos: "FSC", "Orgânico Brasil", "Eureciclo", "Cruelty Free".
 *
 * Permissões:
 * - GET (listar/buscar): público
 * - POST, PUT, DELETE: requer autenticação ADMIN
 *
 * Relacionamentos:
 * - Muitos-para-muitos com Produtos (via ProdutoCertificado)
 * - Um certificado pode ser atribuído a múltiplos produtos
 *
 * Endpoints:
 * - Listagem: GET /api/certificados
 * - Busca: GET /api/certificados/:id
 * - Criar: POST /api/certificados (admin)
 * - Atualizar: PUT /api/certificados/:id (admin)
 * - Deletar: DELETE /api/certificados/:id (admin)
 * ============================================================================
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaCertificadosResponse,
  BuscarCertificadoResponse,
  CriarCertificadoBody,
  CriarCertificadoResponse,
  AtualizarCertificadoBody,
  AtualizarCertificadoResponse,
  OkResponse,
} from "@/types/api";

/**
 * Lista todos os certificados disponíveis.
 * Endpoint público — usado para exibir selos nos cards de produto.
 *
 * @returns Hook com array de certificados, loading e erro
 */
export function useListarCertificados() {
  return useFetch<ListaCertificadosResponse>("/api/certificados");
}

/**
 * Busca um certificado específico pelo ID.
 *
 * @param id - ID do certificado (se null, hook não executa)
 * @returns Hook com dados do certificado
 */
export function useBuscarCertificado(id: number | null) {
  return useFetch<BuscarCertificadoResponse>(
    id ? `/api/certificados/${id}` : null,
  );
}

/**
 * Cria um novo certificado.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para criação de certificado
 *
 * @example
 * const criar = useCriarCertificado();
 * await criar.executar("/api/certificados", {
 *   nome: "Recicla+",
 *   orgaoEmissor: "Instituto Recicla",
 *   descricao: "Certifica que o produto é 100% reciclável"
 * });
 */
export function useCriarCertificado() {
  return useMutation<CriarCertificadoResponse, CriarCertificadoBody>({
    method: "POST",
    invalidar: ["/api/certificados"],
  });
}

/**
 * Atualiza um certificado existente.
 * Requer autenticação ADMIN.
 *
 * @returns Mutation hook para atualização de certificado
 */
export function useAtualizarCertificado() {
  return useMutation<AtualizarCertificadoResponse, AtualizarCertificadoBody>({
    method: "PUT",
    invalidar: ["/api/certificados"],
  });
}

/**
 * Deleta um certificado.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Certificados associados a produtos não podem ser deletados
 * devido a constraint de chave estrangeira.
 *
 * @returns Mutation hook para deleção de certificado
 */
export function useDeletarCertificado() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidar: ["/api/certificados"],
  });
}
