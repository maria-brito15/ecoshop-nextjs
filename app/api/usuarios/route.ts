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
 * @see services/user.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { adminRegistrationSchema } from "@/lib/schemas/user";
import { listUsers, createUser } from "@/services/user.service";
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const users = await listUsers();
    return NextResponse.json({ usuarios: users });
  } catch (err) {
    return ERRORS.internal("listar usuários", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = adminRegistrationSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const user = await createUser(parsed.data);
    return NextResponse.json({ usuario: user }, { status: 201 });
  } catch (err) {
    return mapError(err, "Usuário") ?? ERRORS.internal("criar usuário", err);
  }
}
