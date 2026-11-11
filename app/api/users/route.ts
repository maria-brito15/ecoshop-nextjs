// app/api/users/route.ts

/**
 * ============================================================================
 * USERS API ROUTE - REGISTRO PÚBLICO
 * ============================================================================
 * Endpoint para registro público de novos usuários.
 *
 * POST /api/users - Cria nova conta de usuário (público)
 *
 * Diferencia do POST /api/usuarios (admin):
 * - Este é público (qualquer pessoa pode criar conta)
 * - Tipo de usuário é restrito a CLIENTE ou MARCA (não ADMIN)
 *
 * Fluxo:
 * 1. Rate limiting por IP (5 tentativas/hora)
 * 2. Validação dos dados de registro
 * 3. Verifica se email já está cadastrado
 * 4. Cria usuário com senha hasheada (bcrypt)
 * 5. Gera token JWT e define cookie
 * 6. Retorna dados do usuário (exclui senha)
 *
 * @see services/usuario.service.ts - criarUsuario()
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie, setRefreshCookie } from "@/lib/auth";
import { ERRORS, mapError } from "@/lib/http/responses";
import { publicRegistrationSchema } from "@/lib/schemas/usuario";
import { createUser } from "@/services/usuario.service";
import { startSession } from "@/services/sessao.service";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW = 3600;

/**
 * POST /api/users - Registro público de usuário
 *
 * @body { nome: string, email: string, telefone?: string, senha: string }
 * @returns { ok: true, usuario: { id, email, nome, tipo } } + cookie httpOnly
 * @status 201 - Usuário criado com sucesso
 * @status 400 - Dados inválidos
 * @status 409 - Email já cadastrado
 * @status 429 - Muitas tentativas (rate limit)
 * @status 500 - Erro interno
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { blocked: bloqueado } = await rateLimit(`${ip}:register`, {
      limit: REGISTRATION_LIMIT,
      windowSeconds: REGISTRATION_WINDOW,
    });

    if (bloqueado) {
      return NextResponse.json(
        { erro: "Muitas tentativas de cadastro. Aguarde 1 hora." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = publicRegistrationSchema.safeParse(body);

    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const { nome: name, email, telefone, senha: password, tipo: type, marcaNome: brandName, marcaDescricao: brandDescription } =
      parsed.data;

    // A duplicidade de e-mail é decidida pelo service (ConflitoDeNegocio → 409).
    const user = await createUser({
      nome: name,
      email,
      telefone,
      senha: password,
      tipo: type,
      marcaNome: brandName,
      marcaDescricao: brandDescription,
    });

    // criarUsuario já invalida o cache de usuários.
    const session = await startSession({
      id: user.id,
      email: user.email,
      tipo: user.tipo,
    });

    const res = NextResponse.json(
      {
        ok: true,
        usuario: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          tipo: user.tipo,
        },
        marcaPendente: user.marcaPendente,
      },
      { status: 201 },
    );

    setAuthCookie(res, session.access);
    if (session.refresh) setRefreshCookie(res, session.refresh);
    return res;
  } catch (err) {
    return mapError(err, "Usuário") ?? ERRORS.internal("registrar usuário", err);
  }
}
