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
 * @see services/certificado.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import { certificadoSchema } from "@/lib/schemas/certificado";
import {
  listarCertificados,
  criarCertificado,
} from "@/services/certificado.service";
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
    const certificados = await listarCertificados();
    return NextResponse.json({ certificados });
  } catch {
    return ERROS.interno("listar certificados");
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
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  try {
    const body = await req.json();
    const parsed = certificadoSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const certificado = await criarCertificado(parsed.data);
    return NextResponse.json({ certificado }, { status: 201 });
  } catch {
    return ERROS.interno("criar certificado");
  }
}
