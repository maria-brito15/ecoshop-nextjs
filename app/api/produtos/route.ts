// app/api/produtos/route.ts

/**
 * ============================================================================
 * PRODUTOS API ROUTES
 * ============================================================================
 * Endpoints para gerenciamento de produtos.
 *
 * GET /api/produtos - Lista produtos com paginação e filtros (público)
 * POST /api/produtos - Cria novo produto (requer ADMIN)
 *
 * Filtros suportados no GET:
 * - page: número da página (padrão: 1)
 * - size: itens por página (padrão: 12)
 * - categoriaId: filtrar por categoria
 * - nome: busca textual por nome
 *
 * @see services/produto.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import { produtoSchema } from "@/lib/schemas/produto";
import { listarProdutos, criarProduto } from "@/services/produto.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/produtos - Lista produtos com paginação e filtros
 *
 * @query page - Número da página (default: 1)
 * @query size - Itens por página (default: 12)
 * @query categoriaId - Filtrar por categoria (opcional)
 * @query nome - Busca textual (opcional, case-insensitive)
 * @returns { produtos: Produto[], page: number, size: number, total: number }
 * @status 200 - Lista retornada com sucesso
 * @status 500 - Erro ao listar produtos
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resultado = await listarProdutos(searchParams);
    return NextResponse.json(resultado);
  } catch {
    return ERROS.interno("listar produtos");
  }
}

/**
 * POST /api/produtos - Cria novo produto
 *
 * Requer autenticação ADMIN.
 *
 * @body { nome: string, descricao?: string, preco: number, categoriaId: number, marcaId: number }
 * @returns { produto: Produto }
 * @status 201 - Produto criado
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 500 - Erro ao criar produto
 */
export async function POST(req: NextRequest) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const body = await req.json();
    const parsed = produtoSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const produto = await criarProduto(parsed.data);
    return NextResponse.json({ produto }, { status: 201 });
  } catch {
    return ERROS.interno("criar produto");
  }
}
