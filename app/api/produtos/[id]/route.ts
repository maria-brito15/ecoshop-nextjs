// app/api/produtos/[id]/route.ts

/**
 * ============================================================================
 * PRODUTO BY ID API ROUTES
 * ============================================================================
 * Endpoints para operações em um produto específico.
 *
 * GET /api/produtos/{id} - Busca produto por ID (público)
 * PUT /api/produtos/{id} - Atualiza produto (requer ADMIN)
 * DELETE /api/produtos/{id} - Deleta produto (requer ADMIN)
 *
 * @see services/produto.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateProductSchema } from "@/lib/schemas/produto";
import {
  getProduct,
  updateProduct,
  deleteProduct,
} from "@/services/produto.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/produtos/{id} - Busca produto por ID
 *
 * @param id - ID do produto na URL
 * @returns { produto: Produto }
 * @status 200 - Produto encontrado
 * @status 404 - Produto não existe
 * @status 500 - Erro ao buscar produto
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    const product = await getProduct(id);
    if (!product) return ERRORS.notFound("Produto");
    return NextResponse.json({ produto: product });
  } catch (err) {
    return ERRORS.internal("buscar produto", err);
  }
}

/**
 * PUT /api/produtos/{id} - Atualiza produto
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID do produto na URL
 * @body { nome?: string, descricao?: string, preco?: number, categoriaId?: number, marcaId?: number, certificadoIds?: number[] }
 * @returns { produto: Produto }
 * @status 200 - Produto atualizado
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Produto não existe
 * @status 500 - Erro ao atualizar produto
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
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const product = await updateProduct(id, parsed.data);
    return NextResponse.json({ produto: product });
  } catch (err) {
    return (
      mapError(err, "Produto") ?? ERRORS.internal("atualizar produto", err)
    );
  }
}

/**
 * DELETE /api/produtos/{id} - Deleta produto
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID do produto na URL
 * @returns { ok: true }
 * @status 200 - Produto deletado
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Produto não existe
 * @status 500 - Erro ao deletar produto
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
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      mapError(err, "Produto") ?? ERRORS.internal("deletar produto", err)
    );
  }
}
