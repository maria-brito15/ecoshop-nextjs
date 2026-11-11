// app/api/marcas/[id]/aprovar/route.ts

/**
 * ============================================================================
 * APROVAÇÃO DE MARCA PENDENTE
 * ============================================================================
 * POST /api/marcas/{id}/aprovar - Aprova um pedido de marca pendente (ADMIN)
 *
 * REQ-USR-03, ADR-0018.
 * @see services/marca.service.ts - aprovarMarca()
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { approveBrand } from "@/services/marca.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * POST /api/marcas/{id}/aprovar - Aprova uma marca pendente
 *
 * Requer autenticação ADMIN. Muda `Marca.status` para APROVADA e concede
 * o tipo MARCA ao usuário associado.
 *
 * @param id - ID da marca na URL
 * @returns { marca: Marca }
 * @status 200 - Marca aprovada
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Marca não existe
 * @status 409 - Marca não está pendente
 * @status 500 - Erro ao aprovar marca
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("ID inválido");
    const brand = await approveBrand(id);
    return NextResponse.json({ marca: brand });
  } catch (err) {
    return mapError(err, "Marca") ?? ERRORS.internal("aprovar marca", err);
  }
}
