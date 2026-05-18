// app/api/auth/refresh/route.ts

/**
 * ============================================================================
 * AUTH REFRESH API ROUTE - RENOVAÇÃO DE TOKEN
 * ============================================================================
 * Endpoint para renovar o token JWT quando o tipo de usuário muda no banco.
 *
 * POST /api/auth/refresh - Renova o token com dados atualizados
 *
 * Por que isso é necessário?
 * - O token JWT contém o tipo do usuário (CLIENTE, MARCA, ADMIN)
 * - Se um admin promove um usuário para ADMIN, o token antigo ainda tem tipo antigo
 * - Este endpoint verifica o tipo atual no banco e renova o token se necessário
 *
 * Fluxo:
 * 1. Extrai sessão do cookie
 * 2. Busca usuário no banco (dados atuais)
 * 3. Se tipo mudou → gera novo token e atualiza cookie
 * 4. Invalida cache do perfil do usuário
 *
 * Chamado pelo frontend após /api/auth/me retornar dados
 *
 * @see app/components/Header.tsx - Chamada após carregar usuário
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession, signToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidarChave, chaveUsuarioMe } from "@/lib/cache";
import { ERROS } from "@/lib/http/responses";

/**
 * POST /api/auth/refresh - Renova token JWT
 *
 * @returns { ok: true, tipo?: string } - tipo incluído se houve mudança
 * @status 200 - Token válido (renovado ou não)
 * @status 401 - Não autenticado
 * @status 404 - Usuário não encontrado no banco
 * @status 500 - Erro interno
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return ERROS.naoAutorizado();

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, tipo: true },
    });

    if (!usuario) return ERROS.naoEncontrado("Usuário");

    // Se o tipo no banco é diferente do tipo no token, renova
    if (usuario.tipo !== session.tipo) {
      const novoToken = await signToken({
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
      });

      const res = NextResponse.json({ ok: true, tipo: usuario.tipo });
      setAuthCookie(res, novoToken);
      await invalidarChave(chaveUsuarioMe(usuario.id));

      return res;
    }

    return NextResponse.json({ ok: true, tipo: usuario.tipo });
  } catch {
    return ERROS.interno("renovar token");
  }
}
