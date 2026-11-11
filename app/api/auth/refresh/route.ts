// app/api/auth/refresh/route.ts

/**
 * ============================================================================
 * AUTH REFRESH API ROUTE - RENOVAÇÃO DA SESSÃO (ADR-0021)
 * ============================================================================
 * POST /api/auth/refresh        - Renova a sessão (usado pelo front-end; JSON)
 * GET  /api/auth/refresh?next=  - Renova e REDIRECIONA (usado pelo middleware
 *                                 quando uma navegação de página chega com o
 *                                 acesso expirado e a renovação ainda válida)
 *
 * Com cookie `refresh` (REQ-AUTH-19):
 * - o token é GASTO (uso único) e um par novo é emitido, com o papel relido do banco;
 * - token inválido, expirado, já usado ou de usuário excluído → 401 e cookies removidos;
 * - Redis indisponível → 503 (a renovação é negada; o usuário entra de novo).
 *
 * Sem cookie `refresh` (sessões anteriores ao ADR-0021, ou abertas sem Redis):
 * mantém o comportamento antigo — com um acesso válido, reemite o JWT se o papel
 * do usuário mudou no banco.
 *
 * @see services/sessao.service.ts
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  signToken,
  setAuthCookie,
  setRefreshCookie,
  clearSessionCookies,
} from "@/lib/auth";
import { COOKIE_RENOVACAO } from "@/lib/auth/constantes";
import { invalidarChave, chaveUsuarioMe } from "@/lib/cache";
import { ERROS } from "@/lib/http/responses";
import { caminhoLocalOuRaiz } from "@/lib/http/next-url";
import { buscarIdentidade } from "@/services/usuario.service";
import { renovarSessao } from "@/services/sessao.service";

/** Cookies da renovação concluída. */
function aplicarSessao(
  res: NextResponse,
  sessao: { acesso: string; renovacao: string | null },
) {
  setAuthCookie(res, sessao.acesso);
  if (sessao.renovacao) setRefreshCookie(res, sessao.renovacao);
}

/**
 * POST /api/auth/refresh
 *
 * @returns { ok: true, tipo }
 * @status 200 - Sessão renovada (ou ainda válida, no modo antigo)
 * @status 401 - Sem sessão, ou renovação inválida
 * @status 404 - Usuário da sessão não existe mais (modo antigo)
 * @status 503 - Renovação indisponível (Redis fora)
 */
export async function POST(req: NextRequest) {
  try {
    const tokenDeRenovacao = req.cookies.get(COOKIE_RENOVACAO)?.value;

    if (tokenDeRenovacao) {
      const r = await renovarSessao(tokenDeRenovacao, buscarIdentidade);
      if (!r.ok) {
        const res =
          r.motivo === "INDISPONIVEL"
            ? NextResponse.json(
                { erro: "Não foi possível renovar a sessão agora. Entre novamente." },
                { status: 503 },
              )
            : ERROS.naoAutorizado();
        clearSessionCookies(res);
        return res;
      }
      const res = NextResponse.json({ ok: true, tipo: r.tipo });
      aplicarSessao(res, r.sessao);
      return res;
    }

    // Modo antigo: sem token de renovação.
    const session = await getSession(req);
    if (!session) return ERROS.naoAutorizado();

    const usuario = await buscarIdentidade(session.id);
    if (!usuario) return ERROS.naoEncontrado("Usuário");

    if (usuario.tipo !== session.tipo) {
      const novoToken = await signToken(usuario);
      const res = NextResponse.json({ ok: true, tipo: usuario.tipo });
      setAuthCookie(res, novoToken);
      await invalidarChave(chaveUsuarioMe(usuario.id));
      return res;
    }
    return NextResponse.json({ ok: true, tipo: usuario.tipo });
  } catch (err) {
    return ERROS.interno("renovar sessão", err);
  }
}

/**
 * GET /api/auth/refresh?next=/caminho
 *
 * Renova e redireciona para `next` (só caminho local; REQ-AUTH-17). Se a renovação
 * falha, remove os cookies e leva ao login, com `next` preservado.
 */
export async function GET(req: NextRequest) {
  const destino = caminhoLocalOuRaiz(req.nextUrl.searchParams.get("next"));
  const paraLogin = () => {
    const res = NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(destino)}`, req.url),
    );
    clearSessionCookies(res);
    return res;
  };

  try {
    const r = await renovarSessao(
      req.cookies.get(COOKIE_RENOVACAO)?.value,
      buscarIdentidade,
    );
    if (!r.ok) return paraLogin();

    const res = NextResponse.redirect(new URL(destino, req.url));
    aplicarSessao(res, r.sessao);
    return res;
  } catch {
    return paraLogin();
  }
}
