// app/_middleware/auth.ts

/**
 * ============================================================================
 * AUTH MIDDLEWARE PARA API ROUTES
 * ============================================================================
 * Middlewares de autenticação e autorização para uso dentro de API Routes.
 *
 * DIFERENÇA DO MIDDLEWARE GLOBAL (middleware.ts):
 * - middleware.ts: executa ANTES de todas as requisições (nível de rota)
 * - Este arquivo: executado DENTRO das API Routes (nível de handler)
 *
 * Por que ter middlewares separados?
 * - O middleware global não consegue acessar o corpo da requisição (body)
 * - Algumas rotas precisam validar autenticação APÓS processar o body
 * - Permite lógica de autenticação mais granular por rota
 *
 * Uso típico em API Routes:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const authErro = await requireAdmin(req);
 *   if (authErro) return authErro;
 *
 *   // Lógica da rota aqui (usuário é ADMIN garantido)
 * }
 * ```
 *
 * @see middleware.ts - Middleware global de rotas
 * ============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERROS } from "@/lib/http/responses";

/**
 * Middleware que verifica se o usuário está autenticado.
 *
 * Útil para rotas que exigem qualquer usuário logado (CLIENTE, MARCA ou ADMIN).
 *
 * @param req - Requisição Next.js
 * @returns null se autenticado, ou NextResponse com erro 401 se não autenticado
 *
 * @example
 * // Rota que qualquer usuário logado pode acessar
 * export async function GET(req: NextRequest) {
 *   const authErro = await requireAuth(req);
 *   if (authErro) return authErro;
 *
 *   // Usuário está logado (payload disponível via getSession)
 *   const session = await getSession(req);
 *   return NextResponse.json({ usuarioId: session.id });
 * }
 */
export async function requireAuth(
  req: NextRequest,
): Promise<NextResponse | null> {
  const session = await getSession(req);

  if (!session) {
    return ERROS.naoAutorizado();
  }

  return null;
}

/**
 * Middleware que verifica se o usuário é ADMIN.
 *
 * Útil para rotas administrativas (CRUD de produtos, categorias, etc.).
 *
 * @param req - Requisição Next.js
 * @returns null se ADMIN, ou NextResponse com erro:
 *          - 401 se não autenticado
 *          - 403 se autenticado mas não é ADMIN
 *
 * @example
 * // Rota que apenas ADMIN pode acessar
 * export async function POST(req: NextRequest) {
 *   const authErro = await requireAdmin(req);
 *   if (authErro) return authErro;
 *
 *   // Usuário é ADMIN garantido
 *   const session = await getSession(req);
 *   console.log(`Admin ${session.email} está criando um produto`);
 *
 *   // Lógica de criação...
 * }
 */
export async function requireAdmin(
  req: NextRequest,
): Promise<NextResponse | null> {
  const session = await getSession(req);

  if (!session) {
    return ERROS.naoAutorizado();
  }

  if (session.tipo !== "ADMIN") {
    return ERROS.acessoNegado();
  }

  return null;
}
