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
import { ERROS, mapeiaErro } from "@/lib/http/responses";
import { idDaRota } from "@/lib/http/params";
import { aprovarMarca } from "@/services/marca.service";
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
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const id = await idDaRota(params);
    if (id === null) return ERROS.dadosInvalidos("ID inválido");
    const marca = await aprovarMarca(id);
    return NextResponse.json({ marca });
  } catch (err) {
    return mapeiaErro(err, "Marca") ?? ERROS.interno("aprovar marca", err);
  }
}
