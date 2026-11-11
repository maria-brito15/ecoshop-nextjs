// app/api/certificados/route.ts

/**
 * ============================================================================
 * CERTIFICADOS API ROUTES
 * ============================================================================
 * Endpoints para gerenciamento de certificados de sustentabilidade.
 *
 * GET /api/certificados - Lista todos os certificados (público)
 * POST /api/certificados - Cria novo certificado (requer ADMIN)
 *
 * Certificados são selos como "FSC", "Orgânico Brasil", "Cruelty Free".
 *
 * @see services/certificate.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { certificateSchema } from "@/lib/schemas/certificate";
import {
  listCertificates,
  createCertificate,
} from "@/services/certificate.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/certificados - Lista todos os certificados
 *
 * @returns { certificados: Certificado[] }
 * @status 200 - Lista retornada com sucesso
 * @status 500 - Erro ao buscar certificados
 */
export async function GET() {
  try {
    const certificates = await listCertificates();
    return NextResponse.json({ certificados: certificates });
  } catch (err) {
    return ERRORS.internal("list certificates", err);
  }
}

/**
 * POST /api/certificados - Cria novo certificado
 *
 * Requer autenticação ADMIN.
 *
 * @body { nome: string, descricao?: string, orgaoEmissor: string }
 * @returns { certificado: Certificado }
 * @status 201 - Certificado criado
 * @status 400 - Dados inválidos
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 500 - Erro ao criar certificado
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = certificateSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const certificate = await createCertificate(parsed.data);
    return NextResponse.json({ certificado: certificate }, { status: 201 });
  } catch (err) {
    return (
      mapError(err, "Certificate") ??
      ERRORS.internal("create certificate", err)
    );
  }
}
