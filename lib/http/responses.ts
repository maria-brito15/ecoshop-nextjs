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
import { Prisma } from "@prisma/client";
import {
  ResourceNotFound,
  BusinessConflict,
  OperationNotAllowed,
} from "@/lib/errors/dominio";
import { log, serializeError } from "@/lib/log";

/**
 * Cria uma resposta de erro padrão.
 *
 * @param {string} message - Mensagem descritiva do erro
 * @param {number} status - Código HTTP (ex: 400, 401, 404, 500)
 * @returns {NextResponse} Resposta JSON com { erro: mensagem }
 */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ erro: message }, { status });
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
export const ERRORS = {
  /**
   * 401 Unauthorized - Usuário não autenticado.
   * Usado quando o token está ausente, inválido ou expirado.
   */
  unauthorized: () => errorResponse("Não autorizado", 401),

  /**
   * 403 Forbidden - Usuário autenticado mas sem permissão.
   * Exemplo: usuário CLIENTE tentando acessar rota ADMIN.
   */
  forbidden: () => errorResponse("Acesso negado", 403),

  /**
   * 400 Bad Request - Dados inválidos na requisição.
   * Aceita detalhes opcionais (ex: erros de validação do Zod).
   *
   * @param {unknown} details - Opcional: detalhes adicionais (ex: flatten do Zod)
   */
  invalidData: (details?: unknown) =>
    NextResponse.json({ erro: "Dados inválidos", detalhes: details }, { status: 400 }),

  /**
   * 404 Not Found - Recurso não encontrado.
   * @param {string} resource - Nome do recurso (ex: "Produto", "Usuário")
   */
  notFound: (resource: string) =>
    errorResponse(`${resource} não encontrado`, 404),

  /**
   * 500 Internal Server Error - Erro não tratado.
   * @param {string} contexto - Ação que estava sendo executada (ex: "buscar usuário")
   */
  /**
   * 500. Registra a causa no log (REQ-OPS-19): antes, a exceção era engolida e um
   * 500 em produção não deixava rastro. O corpo da resposta continua sem detalhe.
   *
   * @param context - O que se tentava fazer (vira "Erro ao <contexto>")
   * @param cause - O erro capturado no `catch`
   */
  internal: (context: string, cause?: unknown) => {
    log.error("erro_interno", { contexto: context, erro: serializeError(cause) });
    return errorResponse(`Erro ao ${context}`, 500);
  },

  /**
   * 409 Conflict - Conflito com estado atual do recurso.
   * Exemplo: tentativa de criar usuário com email já existente.
   * @param {string} message - Descrição do conflito
   */
  conflict: (message: string) => errorResponse(message, 409),
} as const;

/**
 * Tabela única que converte um erro conhecido em resposta HTTP (Constitution,
 * Art. VII): erros de domínio tipados (`RecursoNaoEncontrado` → 404,
 * `ConflitoDeNegocio` → 409, `OperacaoNaoAutorizada` → 403) e erros do Prisma pelo `err.code`.
 *
 * IMPORTANTE: nunca decide pelo texto de `err.message`. A mensagem do Prisma é
 * texto livre e pode conter a substring de outro código por coincidência — foi
 * exatamente isso que fez uma exclusão bloqueada por FK (P2003) virar 404 em vez
 * de 409 (REQ-REF-03, D7) e que deixava `PUT` de usuário inexistente em 500.
 *
 * @param err - Erro capturado no catch da rota
 * @param resource - Nome do recurso para as mensagens dos erros do Prisma (ex: "Categoria")
 * @returns A resposta adequada, ou `null` se o erro não é um dos conhecidos
 *          (o chamador deve então cair em `ERROS.interno(...)`)
 *
 * @example
 * try {
 *   await atualizarCategoria(id, data);
 * } catch (err) {
 *   return mapeiaErro(err, "Categoria") ?? ERROS.interno("atualizar categoria");
 * }
 */
export function mapError(err: unknown, resource: string): NextResponse | null {
  if (err instanceof ResourceNotFound) {
    return ERRORS.notFound(err.resource);
  }
  if (err instanceof BusinessConflict) {
    return ERRORS.conflict(err.message);
  }
  if (err instanceof OperationNotAllowed) {
    return errorResponse(err.message, 403);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return ERRORS.notFound(resource);
    if (err.code === "P2002")
      return ERRORS.conflict(`Já existe ${resource.toLowerCase()} com esse nome`);
    if (err.code === "P2003")
      return ERRORS.conflict(
        `${resource} possui vínculos e não pode ser excluído(a) ou alterado(a) para uma referência inexistente`,
      );
    return null;
  }

  return null;
}
