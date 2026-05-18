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
 * @see services/usuario.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERROS } from "@/lib/http/responses";
import { atualizarUsuarioSchema } from "@/lib/schemas/usuario";
import {
  buscarUsuario,
  atualizarUsuario,
  deletarUsuario,
} from "@/services/usuario.service";

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
  const { id } = await params;

  if (!session || (session.id !== Number(id) && session.tipo !== "ADMIN")) {
    return ERROS.acessoNegado();
  }

  try {
    const usuario = await buscarUsuario(Number(id));
    if (!usuario) return ERROS.naoEncontrado("Usuário");
    return NextResponse.json({ usuario });
  } catch {
    return ERROS.interno("buscar usuário");
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
 * @status 404 - Usuário não encontrado
 * @status 500 - Erro ao atualizar usuário
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  const { id } = await params;

  if (!session || (session.id !== Number(id) && session.tipo !== "ADMIN")) {
    return ERROS.acessoNegado();
  }

  try {
    const body = await req.json();
    const parsed = atualizarUsuarioSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const usuario = await atualizarUsuario(Number(id), parsed.data);
    return NextResponse.json({ usuario });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Usuário");
    }
    return ERROS.interno("atualizar usuário");
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
 * @status 500 - Erro ao deletar usuário
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  if (!session || session.tipo !== "ADMIN") return ERROS.acessoNegado();

  try {
    const { id } = await params;
    await deletarUsuario(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Usuário");
    }
    return ERROS.interno("deletar usuário");
  }
}
