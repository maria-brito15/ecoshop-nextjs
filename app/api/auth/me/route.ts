// app/api/auth/me/route.ts

/**
 * ============================================================================
 * AUTH ME API ROUTE - USUÁRIO ATUAL
 * ============================================================================
 * Endpoint para obter os dados do usuário atualmente autenticado.
 *
 * GET /api/auth/me - Retorna dados do usuário da sessão atual
 *
 * Fluxo:
 * 1. Extrai sessão do cookie via getSession()
 * 2. Se não autenticado → retorna 401 com { usuario: null }
 * 3. Busca usuário no banco (com cache via Redis)
 * 4. Retorna dados públicos do usuário (exclui senha)
 *
 * Cache: 1 minuto (TTL.USUARIO)
 * Chave: "usuarios:me:{id}"
 *
 * Uso no frontend:
 * ```ts
 * const { data } = useFetch<AuthMeResponse>("/api/auth/me");
 * if (data?.usuario) {
 *   // Usuário está logado
 * }
 * ```
 *
 * @see lib/auth/jwt.ts - getSession()
 * @see lib/cache - comCache()
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERROS } from "@/lib/http/responses";
import { buscarPerfilDaSessao } from "@/services/usuario.service";

/**
 * GET /api/auth/me - Obtém usuário atual
 *
 * @returns { usuario: UsuarioResumido | null }
 * @status 200 - Sempre retorna 200 com usuario: null se não autenticado
 * @status 401 - Retornado quando não autenticado (mas com corpo { usuario: null })
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ usuario: null }, { status: 401 });
  }

  try {
    const usuario = await buscarPerfilDaSessao(session.id);

    if (!usuario) {
      return NextResponse.json({ usuario: null }, { status: 401 });
    }

    return NextResponse.json({ usuario });
  } catch (err) {
    return ERROS.interno("buscar o usuário da sessão", err);
  }
}
