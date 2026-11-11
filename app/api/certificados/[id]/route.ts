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
 * @see services/certificate.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateCertificateSchema } from "@/lib/schemas/certificate";
import {
  getCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/services/certificate.service";
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
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const certificate = await getCertificate(id);
    if (!certificate) return ERRORS.notFound("Certificate");
    return NextResponse.json({ certificado: certificate });
  } catch (err) {
    return ERRORS.internal("fetch certificate", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const body = await req.json();
    const parsed = updateCertificateSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const certificate = await updateCertificate(id, parsed.data);
    return NextResponse.json({ certificado: certificate });
  } catch (err) {
    return (
      mapError(err, "Certificate") ??
      ERRORS.internal("update certificate", err)
    );
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    await deleteCertificate(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      mapError(err, "Certificate") ??
      ERRORS.internal("delete certificate", err)
    );
  }
}
