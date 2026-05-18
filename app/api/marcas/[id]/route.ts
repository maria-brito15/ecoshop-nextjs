// app/api/marcas/[id]/route.ts

/**
 * ============================================================================
 * MARCA BY ID API ROUTES
 * ============================================================================
 * Endpoints para operações em uma marca específica.
 *
 * GET /api/marcas/{id} - Busca marca por ID (público)
 * PUT /api/marcas/{id} - Atualiza marca (requer ADMIN)
 * DELETE /api/marcas/{id} - Deleta marca (requer ADMIN)
 *
 * @see services/marca.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import { atualizarMarcaSchema } from "@/lib/schemas/marca";
import {
  buscarMarca,
  atualizarMarca,
  deletarMarca,
} from "@/services/marca.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/marcas/{id} - Busca marca por ID
 *
 * @param id - ID da marca na URL
 * @returns { marca: Marca }
 * @status 200 - Marca encontrada
 * @status 404 - Marca não existe
 * @status 500 - Erro ao buscar marca
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const marca = await buscarMarca(Number(id));
    if (!marca) return ERROS.naoEncontrado("Marca");
    return NextResponse.json({ marca });
  } catch {
    return ERROS.interno("buscar marca");
  }
}

/**
 * PUT /api/marcas/{id} - Atualiza marca
 *
 * Requer autenticação ADMIN.
 * NOTA: usuarioId NÃO pode ser alterado após criação.
 *
 * @param id - ID da marca na URL
 * @body { nome?: string, descricao?: string }
 * @returns { marca: Marca }
 * @status 200 - Marca atualizada
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Marca não existe
 * @status 500 - Erro ao atualizar marca
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = atualizarMarcaSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const marca = await atualizarMarca(Number(id), parsed.data);
    return NextResponse.json({ marca });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Marca");
    }
    return ERROS.interno("atualizar marca");
  }
}

/**
 * DELETE /api/marcas/{id} - Deleta marca
 *
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Marcas com produtos associados não podem ser deletadas.
 *
 * @param id - ID da marca na URL
 * @returns { ok: true }
 * @status 200 - Marca deletada
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Marca não existe
 * @status 500 - Erro ao deletar marca
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const { id } = await params;
    await deletarMarca(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Marca");
    }
    return ERROS.interno("deletar marca");
  }
}
