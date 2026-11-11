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
 * @see services/brand.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateBrandSchema } from "@/lib/schemas/brand";
import {
  getBrand,
  updateBrand,
  deleteBrand,
} from "@/services/brand.service";
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
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    const brand = await getBrand(id);
    if (!brand) return ERRORS.notFound("Marca");
    return NextResponse.json({ marca: brand });
  } catch (err) {
    return ERRORS.internal("buscar marca", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    const body = await req.json();
    const parsed = updateBrandSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const brand = await updateBrand(id, parsed.data);
    return NextResponse.json({ marca: brand });
  } catch (err) {
    return mapError(err, "Marca") ?? ERRORS.internal("atualizar marca", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    await deleteBrand(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mapError(err, "Marca") ?? ERRORS.internal("deletar marca", err);
  }
}
