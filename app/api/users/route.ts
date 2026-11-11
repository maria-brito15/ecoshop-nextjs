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
import { ERROS, mapeiaErro } from "@/lib/http/responses";
import { registroPublicoSchema } from "@/lib/schemas/usuario";
import { criarUsuario } from "@/services/usuario.service";
import { iniciarSessao } from "@/services/sessao.service";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const LIMITE_REGISTRO = 5;
const JANELA_REGISTRO = 3600;

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
    const { bloqueado } = await rateLimit(`${ip}:register`, {
      limite: LIMITE_REGISTRO,
      janelaSegundos: JANELA_REGISTRO,
    });

    if (bloqueado) {
      return NextResponse.json(
        { erro: "Muitas tentativas de cadastro. Aguarde 1 hora." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = registroPublicoSchema.safeParse(body);

    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const { nome, email, telefone, senha, tipo, marcaNome, marcaDescricao } =
      parsed.data;

    // A duplicidade de e-mail é decidida pelo service (ConflitoDeNegocio → 409).
    const usuario = await criarUsuario({
      nome,
      email,
      telefone,
      senha,
      tipo,
      marcaNome,
      marcaDescricao,
    });

    // criarUsuario já invalida o cache de usuários.
    const sessao = await iniciarSessao({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
    });

    const res = NextResponse.json(
      {
        ok: true,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
        marcaPendente: usuario.marcaPendente,
      },
      { status: 201 },
    );

    setAuthCookie(res, sessao.acesso);
    if (sessao.renovacao) setRefreshCookie(res, sessao.renovacao);
    return res;
  } catch (err) {
    return mapeiaErro(err, "Usuário") ?? ERROS.interno("registrar usuário", err);
  }
}
