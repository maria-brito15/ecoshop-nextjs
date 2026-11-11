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
 * @see services/session.service.ts
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
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { invalidateKey, currentUserKey } from "@/lib/cache";
import { ERRORS } from "@/lib/http/responses";
import { localPathOrRoot } from "@/lib/http/next-url";
import { getIdentity } from "@/services/user.service";
import { refreshSession, type IssuedSession } from "@/services/session.service";

/** Cookies da renovação concluída. */
function applySession(
  res: NextResponse,
  session: IssuedSession,
) {
  setAuthCookie(res, session.access);
  if (session.refresh) setRefreshCookie(res, session.refresh);
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
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

    if (refreshToken) {
      const r = await refreshSession(refreshToken, getIdentity);
      if (!r.ok) {
        const res =
          r.reason === "INDISPONIVEL"
            ? NextResponse.json(
                { erro: "Não foi possível renovar a sessão agora. Entre novamente." },
                { status: 503 },
              )
            : ERRORS.unauthorized();
        clearSessionCookies(res);
        return res;
      }
      const res = NextResponse.json({ ok: true, tipo: r.tipo });
      applySession(res, r.session);
      return res;
    }

    // Modo antigo: sem token de renovação.
    const session = await getSession(req);
    if (!session) return ERRORS.unauthorized();

    const user = await getIdentity(session.id);
    if (!user) return ERRORS.notFound("Usuário");

    if (user.tipo !== session.tipo) {
      const newToken = await signToken(user);
      const res = NextResponse.json({ ok: true, tipo: user.tipo });
      setAuthCookie(res, newToken);
      await invalidateKey(currentUserKey(user.id));
      return res;
    }
    return NextResponse.json({ ok: true, tipo: user.tipo });
  } catch (err) {
    return ERRORS.internal("renovar sessão", err);
  }
}

/**
 * GET /api/auth/refresh?next=/caminho
 *
 * Renova e redireciona para `next` (só caminho local; REQ-AUTH-17). Se a renovação
 * falha, remove os cookies e leva ao login, com `next` preservado.
 */
export async function GET(req: NextRequest) {
  const destination = localPathOrRoot(req.nextUrl.searchParams.get("next"));
  const toLogin = () => {
    const res = NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(destination)}`, req.url),
    );
    clearSessionCookies(res);
    return res;
  };

  try {
    const r = await refreshSession(
      req.cookies.get(REFRESH_COOKIE)?.value,
      getIdentity,
    );
    if (!r.ok) return toLogin();

    const res = NextResponse.redirect(new URL(destination, req.url));
    applySession(res, r.session);
    return res;
  } catch {
    return toLogin();
  }
}
