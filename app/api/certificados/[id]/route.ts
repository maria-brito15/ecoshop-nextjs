// app/api/certificados/[id]/route.ts

/**
 * ============================================================================
 * CERTIFICADO BY ID API ROUTES
 * ============================================================================
 * Endpoints para operações em um certificado específico.
 *
 * GET /api/certificados/{id} - Busca certificado por ID (público)
 * PUT /api/certificados/{id} - Atualiza certificado (requer ADMIN)
 * DELETE /api/certificados/{id} - Deleta certificado (requer ADMIN)
 *
 * @see services/certificado.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import { atualizarCertificadoSchema } from "@/lib/schemas/certificado";
import {
  buscarCertificado,
  atualizarCertificado,
  deletarCertificado,
} from "@/services/certificado.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/certificados/{id} - Busca certificado por ID
 *
 * @param id - ID do certificado na URL
 * @returns { certificado: Certificado }
 * @status 200 - Certificado encontrado
 * @status 404 - Certificado não existe
 * @status 500 - Erro ao buscar certificado
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const certificado = await buscarCertificado(Number(id));
    if (!certificado) return ERROS.naoEncontrado("Certificado");
    return NextResponse.json({ certificado });
  } catch {
    return ERROS.interno("buscar certificado");
  }
}

/**
 * PUT /api/certificados/{id} - Atualiza certificado
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID do certificado na URL
 * @body { nome?: string, descricao?: string, orgaoEmissor?: string }
 * @returns { certificado: Certificado }
 * @status 200 - Certificado atualizado
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Certificado não existe
 * @status 500 - Erro ao atualizar certificado
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
    const parsed = atualizarCertificadoSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const certificado = await atualizarCertificado(Number(id), parsed.data);
    return NextResponse.json({ certificado });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Certificado");
    }
    return ERROS.interno("atualizar certificado");
  }
}

/**
 * DELETE /api/certificados/{id} - Deleta certificado
 *
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Certificados associados a produtos não podem ser deletados.
 *
 * @param id - ID do certificado na URL
 * @returns { ok: true }
 * @status 200 - Certificado deletado
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Certificado não existe
 * @status 500 - Erro ao deletar certificado
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const { id } = await params;
    await deletarCertificado(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("P2025")) {
      return ERROS.naoEncontrado("Certificado");
    }
    return ERROS.interno("deletar certificado");
  }
}
