// app/api/usuarios/[id]/route.ts

/**
 * ============================================================================
 * USUARIO BY ID API ROUTES
 * ============================================================================
 * Endpoints para operações em um usuário específico.
 *
 * GET /api/usuarios/{id} - Busca usuário por ID
 * PUT /api/usuarios/{id} - Atualiza usuário
 * DELETE /api/usuarios/{id} - Deleta usuário (requer ADMIN)
 *
 * Regras de permissão:
 * - GET: Usuário pode ver apenas seu próprio perfil (ou ADMIN vê qualquer um)
 * - PUT: Usuário pode editar apenas seu próprio perfil (ou ADMIN edita qualquer um)
 * - DELETE: Apenas ADMIN pode deletar usuários
 *
 * @see services/user.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateUserSchema } from "@/lib/schemas/user";
import {
  getUser,
  updateUser,
  deleteUser,
} from "@/services/user.service";

/**
 * GET /api/usuarios/{id} - Busca usuário por ID
 *
 * Permissão: Usuário pode ver apenas seu próprio perfil.
 * ADMIN pode ver qualquer usuário.
 *
 * @param id - ID do usuário na URL
 * @returns { usuario: Usuario }
 * @status 200 - Usuário encontrado
 * @status 401 - Não autenticado
 * @status 403 - Acesso negado (tentando ver outro usuário sem ser ADMIN)
 * @status 404 - Usuário não encontrado
 * @status 500 - Erro ao buscar usuário
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  const id = await routeId(params);

  if (!session || (session.id !== id && session.tipo !== "ADMIN")) {
    return ERRORS.forbidden();
  }
  if (id === null) return ERRORS.invalidData("ID inválido");

  try {
    const user = await getUser(id);
    if (!user) return ERRORS.notFound("Usuário");
    return NextResponse.json({ usuario: user });
  } catch (err) {
    return ERRORS.internal("buscar usuário", err);
  }
}

/**
 * PUT /api/usuarios/{id} - Atualiza usuário
 *
 * Permissão: Usuário pode editar apenas seu próprio perfil.
 * ADMIN pode editar qualquer usuário.
 *
 * @param id - ID do usuário na URL
 * @body { nome?: string, email?: string, telefone?: string, senha?: string }
 * @returns { usuario: Usuario }
 * @status 200 - Usuário atualizado
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Acesso negado
 * @status 403 - Acesso negado, ou senha atual incorreta ao trocar a própria senha
 * @status 404 - Usuário não encontrado
 * @status 409 - E-mail já cadastrado
 * @status 500 - Erro ao atualizar usuário
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  const id = await routeId(params);

  if (!session || (session.id !== id && session.tipo !== "ADMIN")) {
    return ERRORS.forbidden();
  }
  if (id === null) return ERRORS.invalidData("ID inválido");

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const user = await updateUser(id, parsed.data, session.id);
    return NextResponse.json({ usuario: user });
  } catch (err) {
    return mapError(err, "Usuário") ?? ERRORS.internal("atualizar usuário", err);
  }
}

/**
 * DELETE /api/usuarios/{id} - Deleta usuário
 *
 * Permissão: Apenas ADMIN pode deletar usuários.
 *
 * @param id - ID do usuário na URL
 * @returns { ok: true }
 * @status 200 - Usuário deletado
 * @status 401 - Não autenticado
 * @status 403 - Acesso negado (não é ADMIN)
 * @status 404 - Usuário não encontrado
 * @status 409 - Conta do próprio ADMIN, ou usuário com vínculos (ex.: marca)
 * @status 500 - Erro ao deletar usuário
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  if (!session || session.tipo !== "ADMIN") return ERRORS.forbidden();

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    await deleteUser(id, session.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mapError(err, "Usuário") ?? ERRORS.internal("deletar usuário", err);
  }
}
