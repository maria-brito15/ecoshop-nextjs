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
import { ERROS } from "@/lib/http/responses";
import { marcaSchema } from "@/lib/schemas/marca";
import { listarMarcas, criarMarca } from "@/services/marca.service";
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
    const marcas = await listarMarcas();
    return NextResponse.json({ marcas });
  } catch {
    return ERROS.interno("listar marcas");
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
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const body = await req.json();
    const parsed = marcaSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const marca = await criarMarca(parsed.data);
    return NextResponse.json({ marca }, { status: 201 });
  } catch {
    return ERROS.interno("criar marca");
  }
}
