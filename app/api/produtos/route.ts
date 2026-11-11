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
 * - marcaId: filtrar por marca (REQ-CAT-07)
 * - precoMax: preço máximo (REQ-CAT-06)
 * - sort: relevancia (padrão) | preco_asc | preco_desc | nome_asc | nome_desc (REQ-CAT-06)
 * - nome: busca textual por nome
 *
 * @see services/product.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { productSchema, listProductsQuerySchema } from "@/lib/schemas/product";
import { listProducts, createProduct } from "@/services/product.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/produtos - Lista produtos com paginação e filtros
 *
 * @query page - Número da página (default: 1)
 * @query size - Itens por página (default: 12)
 * @query categoriaId - Filtrar por categoria (opcional)
 * @query marcaId - Filtrar por marca (opcional, REQ-CAT-07)
 * @query precoMax - Preço máximo (opcional, REQ-CAT-06)
 * @query sort - relevancia (default) | preco_asc | preco_desc | nome_asc | nome_desc (REQ-CAT-06)
 * @query nome - Busca textual (opcional, case-insensitive)
 * @returns { produtos: Produto[], page: number, size: number, total: number }
 * @status 200 - Lista retornada com sucesso
 * @status 500 - Erro ao listar produtos
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listProductsQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const result = await listProducts(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return ERRORS.internal("list products", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const product = await createProduct(parsed.data);
    return NextResponse.json({ produto: product }, { status: 201 });
  } catch (err) {
    return mapError(err, "Product") ?? ERRORS.internal("create product", err);
  }
}
