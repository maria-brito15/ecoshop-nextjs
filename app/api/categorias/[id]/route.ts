// app/api/categorias/[id]/route.ts

/**
 * ============================================================================
 * CATEGORIA BY ID API ROUTES
 * ============================================================================
 * Endpoints para operações em uma categoria específica.
 *
 * GET /api/categorias/{id} - Busca categoria por ID (público)
 * PUT /api/categorias/{id} - Atualiza categoria (requer ADMIN)
 * DELETE /api/categorias/{id} - Deleta categoria (requer ADMIN)
 *
 * Permissões:
 * - GET: Público
 * - PUT/DELETE: Apenas ADMIN
 *
 * @see services/category.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateCategorySchema } from "@/lib/schemas/category";
import {
  getCategory,
  updateCategory,
  deleteCategory,
} from "@/services/category.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/categorias/{id} - Busca categoria por ID
 *
 * @param id - ID da categoria na URL
 * @returns { categoria: Categoria }
 * @status 200 - Categoria encontrada
 * @status 404 - Categoria não existe
 * @status 500 - Erro ao buscar categoria
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    const category = await getCategory(id);
    if (!category) return ERRORS.notFound("Categoria");
    return NextResponse.json({ categoria: category });
  } catch (err) {
    return ERRORS.internal("buscar categoria", err);
  }
}

/**
 * PUT /api/categorias/{id} - Atualiza categoria
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID da categoria na URL
 * @body { nome?: string, descricao?: string }
 * @returns { categoria: Categoria }
 * @status 200 - Categoria atualizada
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Categoria não existe
 * @status 500 - Erro ao atualizar categoria
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const category = await updateCategory(id, parsed.data);
    return NextResponse.json({ categoria: category });
  } catch (err) {
    return (
      mapError(err, "Categoria") ??
      ERRORS.internal("atualizar categoria", err)
    );
  }
}

/**
 * DELETE /api/categorias/{id} - Deleta categoria
 *
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Categorias com produtos associados não podem ser deletadas.
 *
 * @param id - ID da categoria na URL
 * @returns { ok: true }
 * @status 200 - Categoria deletada
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Categoria não existe
 * @status 409 - Categoria possui produtos (indireto via erro Prisma P2003)
 * @status 500 - Erro ao deletar categoria
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      mapError(err, "Categoria") ?? ERRORS.internal("deletar categoria", err)
    );
  }
}
