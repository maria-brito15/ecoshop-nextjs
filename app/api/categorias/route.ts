// app/api/categorias/route.ts

/**
 * ============================================================================
 * CATEGORIAS API ROUTES
 * ============================================================================
 * Endpoints para gerenciamento de categorias de produtos.
 *
 * GET /api/categorias - Lista todas as categorias (público)
 * POST /api/categorias - Cria nova categoria (requer ADMIN)
 *
 * Permissões:
 * - GET: Público (qualquer usuário pode ver categorias)
 * - POST: Apenas ADMIN
 *
 * @see services/categoria.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import { categoriaSchema } from "@/lib/schemas/categoria";
import { listarCategorias, criarCategoria } from "@/services/categoria.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/categorias - Lista todas as categorias
 *
 * @returns { categorias: Categoria[] }
 * @status 200 - Lista retornada com sucesso (pode ser vazia)
 * @status 500 - Erro ao buscar categorias
 */
export async function GET() {
  try {
    const categorias = await listarCategorias();
    return NextResponse.json({ categorias });
  } catch {
    return ERROS.interno("listar categorias");
  }
}

/**
 * POST /api/categorias - Cria nova categoria
 *
 * Requer autenticação ADMIN.
 *
 * @body { nome: string, descricao?: string }
 * @returns { categoria: Categoria }
 * @status 201 - Categoria criada com sucesso
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 500 - Erro ao criar categoria
 */
export async function POST(req: NextRequest) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const body = await req.json();
    const parsed = categoriaSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const categoria = await criarCategoria(parsed.data);
    return NextResponse.json({ categoria }, { status: 201 });
  } catch {
    return ERROS.interno("criar categoria");
  }
}
