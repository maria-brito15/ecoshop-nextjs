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
import { ERROS } from "@/lib/http/responses";
import { atualizarProdutoSchema } from "@/lib/schemas/produto";
import {
  buscarProduto,
  atualizarProduto,
  deletarProduto,
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
    const { id } = await params;
    const produto = await buscarProduto(Number(id));
    if (!produto) return ERROS.naoEncontrado("Produto");
    return NextResponse.json({ produto });
  } catch {
    return ERROS.interno("buscar produto");
  }
}

/**
 * PUT /api/produtos/{id} - Atualiza produto
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID do produto na URL
 * @body { nome?: string, descricao?: string, preco?: number, categoriaId?: number, marcaId?: number }
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
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = atualizarProdutoSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const produto = await atualizarProduto(Number(id), parsed.data);
    return NextResponse.json({ produto });
  } catch {
    return ERROS.interno("atualizar produto");
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
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const { id } = await params;
    await deletarProduto(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Produto");
    }
    return ERROS.interno("deletar produto");
  }
}
