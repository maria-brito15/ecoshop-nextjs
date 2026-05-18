// app/api/auth/route.ts

/**
 * ============================================================================
 * AUTH API ROUTES - LOGIN E LOGOUT
 * ============================================================================
 * Endpoints de autenticação da aplicação.
 *
 * POST /api/auth - Login de usuário
 * DELETE /api/auth - Logout de usuário (remove cookie)
 *
 * Fluxo de login:
 * 1. Rate limiting por IP (10 tentativas/minuto)
 * 2. Validação do corpo da requisição (email + senha)
 * 3. Busca usuário no banco por email
 * 4. Verifica senha com bcrypt.compareSync
 * 5. Gera token JWT com expiração de 7 dias
 * 6. Define cookie httpOnly com o token
 * 7. Retorna dados do usuário (excluindo senha)
 *
 * IMPORTANTE: O cookie é httpOnly (inacessível via JavaScript)
 * e secure em produção (apenas HTTPS). Isso mitiga ataques XSS.
 *
 * @see lib/auth/jwt.ts - Implementação do JWT
 * @see lib/rate-limit.ts - Rate limiting com Redis
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { ERROS } from "@/lib/http/responses";
import { loginSchema } from "@/lib/schemas/usuario";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

const LIMITE_TENTATIVAS = 10;
const JANELA_SEGUNDOS = 60;

/**
 * POST /api/auth - Login de usuário
 *
 * @body { email: string, senha: string }
 * @returns { ok: true, usuario: { id, email, tipo } } + cookie httpOnly
 * @status 200 - Login bem-sucedido
 * @status 400 - Dados inválidos (email ou senha faltando)
 * @status 401 - Credenciais inválidas
 * @status 429 - Muitas tentativas (rate limit)
 * @status 500 - Erro interno no servidor
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { bloqueado } = await rateLimit(ip, {
      limite: LIMITE_TENTATIVAS,
      janelaSegundos: JANELA_SEGUNDOS,
    });

    if (bloqueado) {
      return NextResponse.json(
        { erro: "Muitas tentativas. Aguarde 1 minuto e tente novamente." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos();

    const { email, senha } = parsed.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return ERROS.naoAutorizado();
    }

    const token = await signToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo as "CLIENTE" | "MARCA" | "ADMIN",
    });

    const res = NextResponse.json({
      ok: true,
      usuario: { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
    });

    setAuthCookie(res, token);
    return res;
  } catch {
    return ERROS.interno("processar autenticação");
  }
}

/**
 * DELETE /api/auth - Logout de usuário
 *
 * Remove o cookie de autenticação da resposta.
 *
 * @returns { ok: true }
 * @status 200 - Logout bem-sucedido
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("token");
  return res;
}
