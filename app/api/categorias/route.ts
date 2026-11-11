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
 * @see services/category.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { categorySchema } from "@/lib/schemas/category";
import { listCategories, createCategory } from "@/services/category.service";
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
    const categories = await listCategories();
    return NextResponse.json({ categorias: categories });
  } catch (err) {
    return ERRORS.internal("listar categorias", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const category = await createCategory(parsed.data);
    return NextResponse.json({ categoria: category }, { status: 201 });
  } catch (err) {
    return (
      mapError(err, "Categoria") ?? ERRORS.internal("criar categoria", err)
    );
  }
}
