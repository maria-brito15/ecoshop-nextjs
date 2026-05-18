// app/api/usuarios/route.ts

/**
 * ============================================================================
 * USUARIOS API ROUTES (ADMIN)
 * ============================================================================
 * Endpoints administrativos para gerenciamento de usuários.
 *
 * GET /api/usuarios - Lista todos os usuários (requer ADMIN)
 * POST /api/usuarios - Cria novo usuário (requer ADMIN)
 *
 * Diferencia do POST /api/users (público):
 * - Este é restrito a ADMIN
 * - Permite criar usuários de qualquer tipo (incluindo ADMIN)
 *
 * @see services/usuario.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import { cadastroAdminSchema } from "@/lib/schemas/usuario";
import { listarUsuarios, criarUsuario } from "@/services/usuario.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/usuarios - Lista todos os usuários
 *
 * Requer autenticação ADMIN.
 *
 * @returns { usuarios: Usuario[] }
 * @status 200 - Lista retornada
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 500 - Erro ao listar usuários
 */
export async function GET(req: NextRequest) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const usuarios = await listarUsuarios();
    return NextResponse.json({ usuarios });
  } catch {
    return ERROS.interno("listar usuários");
  }
}

/**
 * POST /api/usuarios - Cria novo usuário (admin)
 *
 * Requer autenticação ADMIN.
 *
 * @body { nome: string, email: string, telefone?: string, senha: string, tipo?: "CLIENTE" | "MARCA" | "ADMIN" }
 * @returns { usuario: Usuario }
 * @status 201 - Usuário criado
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 409 - Email já cadastrado
 * @status 500 - Erro ao criar usuário
 */
export async function POST(req: NextRequest) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const body = await req.json();
    const parsed = cadastroAdminSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const usuario = await criarUsuario(parsed.data);
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_JA_CADASTRADO") {
      return ERROS.conflito("Email já cadastrado");
    }
    return ERROS.interno("criar usuário");
  }
}
