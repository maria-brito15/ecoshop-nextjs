// app/api/ia/scan/route.ts

/**
 * ============================================================================
 * IA SCAN API ROUTE - ECOSCAN
 * ============================================================================
 * Rota de API para análise de imagens com IA (reconhecimento de produtos recicláveis).
 *
 * POST /api/ia/scan - Analisa imagem e retorna informações de reciclagem
 *
 * Endpoint privado - requer autenticação (usuário logado).
 *
 * Fluxo:
 * 1. Verifica autenticação do usuário (requireAuth)
 * 2. Extrai arquivo do FormData
 * 3. Valida tipo e tamanho do arquivo
 * 4. Converte para Buffer para processamento
 * 5. Chama serviço de IA para análise da imagem
 * 6. Retorna resultado (sucesso com dados ou erro)
 *
 * Limites:
 * - Tamanho máximo: 10MB
 * - Formatos aceitos: JPG, PNG, GIF, WebP
 *
 * @see lib/ai/analisar-imagem.ts - Orquestração da análise
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { analisarImagem } from "@/lib/ai";
import { ERROS } from "@/lib/http/responses";
import { requireAuth } from "@/app/_middleware/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/ia/scan - Analisa imagem
 *
 * Requer autenticação (usuário logado).
 *
 * @body FormData com campo 'image' (arquivo)
 * @returns ResultadoScan (sucesso ou falha)
 * @status 200 - Análise bem-sucedida
 * @status 401 - Não autenticado
 * @status 400 - Dados inválidos (arquivo ausente, tipo errado, tamanho excedido)
 * @status 422 - Imagem não pôde ser analisada (formato não suportado pela IA)
 * @status 500 - Erro interno
 */
export async function POST(req: NextRequest) {
  const authErro = await requireAuth(req);
  if (authErro) return authErro;

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return ERROS.dadosInvalidos("Nenhuma imagem enviada");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return ERROS.dadosInvalidos(
        "Formato inválido. Use: jpg, jpeg, png, gif ou webp",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return ERROS.dadosInvalidos("Arquivo muito grande (máx: 10MB)");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageId = `analise_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const resultado = await analisarImagem(buffer, imageId);

    return NextResponse.json(resultado, {
      status: resultado.sucesso ? 200 : 422,
    });
  } catch {
    return ERROS.interno("processar análise");
  }
}
