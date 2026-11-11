// app/api/auth/route.ts

/**
 * ============================================================================
 * AUTH API ROUTES - LOGIN E LOGOUT
 * ============================================================================
 * POST /api/auth - Login
 * DELETE /api/auth - Logout (revoga a renovação e remove os cookies)
 *
 * Fluxo de login:
 * 1. Rate limiting por IP (10 tentativas/minuto)
 * 2. Validação do corpo (email + senha)
 * 3. `verificarCredenciais`: bcrypt SEMPRE executado, com ou sem conta (REQ-AUTH-23)
 * 4. `iniciarSessao`: JWT de acesso (15 min) + token de renovação no Redis (ADR-0021)
 * 5. Cookies httpOnly `token` e `refresh`
 *
 * Sem Redis o login continua: só não há token de renovação (REQ-AUTH-19).
 *
 * @see services/sessao.service.ts - Sessão
 * @see lib/rate-limit.ts - Rate limiting
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie, setRefreshCookie, clearSessionCookies } from "@/lib/auth";
import { REFRESH_COOKIE } from "@/lib/auth/constantes";
import { ERRORS } from "@/lib/http/responses";
import { loginSchema } from "@/lib/schemas/usuario";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCredentials } from "@/services/usuario.service";
import { startSession, endSession } from "@/services/sessao.service";

const ATTEMPT_LIMIT = 10;
const WINDOW_SECONDS = 60;

/**
 * POST /api/auth - Login de usuário
 *
 * @body { email: string, senha: string }
 * @returns { ok: true, usuario: { id, email, tipo } } + cookies httpOnly
 * @status 200 - Login bem-sucedido
 * @status 400 - Dados inválidos (email ou senha faltando)
 * @status 401 - Credenciais inválidas
 * @status 429 - Muitas tentativas (rate limit)
 * @status 500 - Erro interno no servidor
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { blocked: blocked } = await rateLimit(ip, {
      limit: ATTEMPT_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    });

    if (blocked) {
      return NextResponse.json(
        { erro: "Muitas tentativas. Aguarde 1 minuto e tente novamente." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData();

    const { email, senha: password } = parsed.data;
    const identity = await verifyCredentials(email, password);
    if (!identity) return ERRORS.unauthorized();

    const session = await startSession(identity);

    const res = NextResponse.json({
      ok: true,
      usuario: {
        id: identity.id,
        email: identity.email,
        tipo: identity.tipo,
      },
    });

    setAuthCookie(res, session.access);
    if (session.refresh) setRefreshCookie(res, session.refresh);
    return res;
  } catch (err) {
    return ERRORS.internal("processar autenticação", err);
  }
}

/**
 * DELETE /api/auth - Logout de usuário
 *
 * Revoga o token de renovação (REQ-AUTH-20) e remove os dois cookies.
 *
 * @returns { ok: true }
 * @status 200 - Logout bem-sucedido
 */
export async function DELETE(req: NextRequest) {
  await endSession(req.cookies.get(REFRESH_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
