// app/api/marcas/route.ts

/**
 * ============================================================================
 * MARCAS API ROUTES
 * ============================================================================
 * Endpoints para gerenciamento de marcas.
 *
 * GET /api/marcas - Lista todas as marcas (público)
 * POST /api/marcas - Cria nova marca (requer ADMIN)
 *
 * Marcas representam fabricantes/empresas parceiras.
 * Cada marca está associada a um usuário do tipo MARCA ou ADMIN.
 *
 * @see services/marca.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { brandSchema } from "@/lib/schemas/marca";
import { listBrands, createBrand } from "@/services/marca.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/marcas - Lista todas as marcas
 *
 * @returns { marcas: Marca[] }
 * @status 200 - Lista retornada com sucesso
 * @status 500 - Erro ao buscar marcas
 */
export async function GET() {
  try {
    const brands = await listBrands();
    return NextResponse.json({ marcas: brands });
  } catch (err) {
    return ERRORS.internal("listar marcas", err);
  }
}

/**
 * POST /api/marcas - Cria nova marca
 *
 * Requer autenticação ADMIN.
 *
 * @body { nome: string, descricao?: string, usuarioId: number }
 * @returns { marca: Marca }
 * @status 201 - Marca criada
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 500 - Erro ao criar marca
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const brand = await createBrand(parsed.data);
    return NextResponse.json({ marca: brand }, { status: 201 });
  } catch (err) {
    return mapError(err, "Marca") ?? ERRORS.internal("criar marca", err);
  }
}
