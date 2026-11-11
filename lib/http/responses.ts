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
  RecursoNaoEncontrado,
  ConflitoDeNegocio,
  OperacaoNaoAutorizada,
} from "@/lib/errors/dominio";
import { log, serializarErro } from "@/lib/log";

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
  /**
   * 500. Registra a causa no log (REQ-OPS-19): antes, a exceção era engolida e um
   * 500 em produção não deixava rastro. O corpo da resposta continua sem detalhe.
   *
   * @param contexto - O que se tentava fazer (vira "Erro ao <contexto>")
   * @param causa - O erro capturado no `catch`
   */
  interno: (contexto: string, causa?: unknown) => {
    log.error("erro_interno", { contexto, erro: serializarErro(causa) });
    return erroResponse(`Erro ao ${contexto}`, 500);
  },

  /**
   * 409 Conflict - Conflito com estado atual do recurso.
   * Exemplo: tentativa de criar usuário com email já existente.
   * @param {string} mensagem - Descrição do conflito
   */
  conflito: (mensagem: string) => erroResponse(mensagem, 409),
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
 * @param recurso - Nome do recurso para as mensagens dos erros do Prisma (ex: "Categoria")
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
export function mapeiaErro(err: unknown, recurso: string): NextResponse | null {
  if (err instanceof RecursoNaoEncontrado) {
    return ERROS.naoEncontrado(err.recurso);
  }
  if (err instanceof ConflitoDeNegocio) {
    return ERROS.conflito(err.message);
  }
  if (err instanceof OperacaoNaoAutorizada) {
    return erroResponse(err.message, 403);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return ERROS.naoEncontrado(recurso);
    if (err.code === "P2002")
      return ERROS.conflito(`Já existe ${recurso.toLowerCase()} com esse nome`);
    if (err.code === "P2003")
      return ERROS.conflito(
        `${recurso} possui vínculos e não pode ser excluído(a) ou alterado(a) para uma referência inexistente`,
      );
    return null;
  }

  return null;
}
