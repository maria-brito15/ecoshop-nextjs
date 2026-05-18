// lib/http/responses.ts

/**
 * ============================================================================
 * HTTP RESPONSE HELPERS
 * ============================================================================
 * Este módulo fornece funções utilitárias para padronizar respostas HTTP
 * nas rotas de API do Next.js.
 *
 * Objetivos:
 * - Centralizar mensagens de erro (DRY)
 * - Garantir consistência nos códigos HTTP
 * - Facilitar manutenção (mudar mensagem em um único lugar)
 *
 * IMPORTANTE: Todas as respostas seguem o padrão:
 * { erro: string } | { erro: string, detalhes?: unknown }
 * ============================================================================
 */

import { NextResponse } from "next/server";

/**
 * Cria uma resposta de erro padrão.
 *
 * @param {string} mensagem - Mensagem descritiva do erro
 * @param {number} status - Código HTTP (ex: 400, 401, 404, 500)
 * @returns {NextResponse} Resposta JSON com { erro: mensagem }
 */
export function erroResponse(mensagem: string, status: number): NextResponse {
  return NextResponse.json({ erro: mensagem }, { status });
}

/**
 * Constantes de erro pré-definidas para uso nas rotas de API.
 *
 * Uso típico em route.ts:
 * ```ts
 * import { ERROS } from "@/lib/http/responses";
 *
 * export async function GET(req: NextRequest) {
 *   if (!autenticado) return ERROS.naoAutorizado();
 *   // ...
 * }
 * ```
 */
export const ERROS = {
  /**
   * 401 Unauthorized - Usuário não autenticado.
   * Usado quando o token está ausente, inválido ou expirado.
   */
  naoAutorizado: () => erroResponse("Não autorizado", 401),

  /**
   * 403 Forbidden - Usuário autenticado mas sem permissão.
   * Exemplo: usuário CLIENTE tentando acessar rota ADMIN.
   */
  acessoNegado: () => erroResponse("Acesso negado", 403),

  /**
   * 400 Bad Request - Dados inválidos na requisição.
   * Aceita detalhes opcionais (ex: erros de validação do Zod).
   *
   * @param {unknown} detalhes - Opcional: detalhes adicionais (ex: flatten do Zod)
   */
  dadosInvalidos: (detalhes?: unknown) =>
    NextResponse.json({ erro: "Dados inválidos", detalhes }, { status: 400 }),

  /**
   * 404 Not Found - Recurso não encontrado.
   * @param {string} recurso - Nome do recurso (ex: "Produto", "Usuário")
   */
  naoEncontrado: (recurso: string) =>
    erroResponse(`${recurso} não encontrado`, 404),

  /**
   * 500 Internal Server Error - Erro não tratado.
   * @param {string} contexto - Ação que estava sendo executada (ex: "buscar usuário")
   */
  interno: (contexto: string) => erroResponse(`Erro ao ${contexto}`, 500),

  /**
   * 409 Conflict - Conflito com estado atual do recurso.
   * Exemplo: tentativa de criar usuário com email já existente.
   * @param {string} mensagem - Descrição do conflito
   */
  conflito: (mensagem: string) => erroResponse(mensagem, 409),
} as const;
