// app/api/ia/chat/route.ts

/**
 * ============================================================================
 * IA CHAT API ROUTE - GEMINI
 * ============================================================================
 * Rota de API para chat com IA (Gemini) sobre sustentabilidade e reciclagem.
 *
 * POST /api/ia/chat - Envia mensagem e recebe resposta da IA
 *
 * Endpoint público - não requer autenticação.
 * Utiliza modelo Gemini 2.0 Flash do Google.
 *
 * Fluxo:
 * 1. Valida entrada do usuário (mensagem e histórico)
 * 2. Verifica se API key do Gemini está configurada
 * 3. Constrói o histórico completo com system prompt
 * 4. Chama a API do Gemini com configurações de temperatura
 * 5. Retorna a resposta gerada
 *
 * Parâmetros de geração (generationConfig):
 * - temperature: 0.8 → controla criatividade
 * - topK: 40 → número de palavras candidatas consideradas
 * - topP: 0.95 → nucleus sampling
 * - maxOutputTokens: 1024 → limite máximo da resposta
 *
 * @see lib/ai/providers/gemini-chat.ts - Cliente Gemini
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS } from "@/lib/http/responses";
import { chatSchema } from "@/lib/schemas/ai-chat";
import {
  generateWithHistory,
  isGeminiConfigured,
} from "@/lib/ai/providers/gemini-chat";
import { requireAuth } from "@/app/_middleware/auth";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `Você é um assistente especialista em sustentabilidade e reciclagem da EcoShop. Responda em português. Seja objetivo e informativo. Forneça dicas práticas sobre descarte correto, reciclagem e alternativas sustentáveis.`;

/**
 * POST /api/ia/chat - Chat com assistente IA
 *
 * @body { mensagem: string, historico?: ChatMessage[] }
 * @returns { resposta: string }
 * @status 200 - Resposta gerada com sucesso
 * @status 400 - Dados inválidos
 * @status 503 - IA não configurada (chave ausente)
 * @status 502 - IA retornou erro
 * @status 500 - Erro interno no servidor
 */
// Limite por usuário: o chat consome a cota paga do Gemini (D3).
const MESSAGE_LIMIT = 20;
const WINDOW_SECONDS = 60;

export async function POST(req: NextRequest) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const session = await getSession(req);
  const { blocked: blocked } = await rateLimit(`chat:${session!.id}`, {
    limit: MESSAGE_LIMIT,
    windowSeconds: WINDOW_SECONDS,
  });
  if (blocked) {
    return NextResponse.json(
      { erro: "Muitas mensagens. Aguarde 1 minuto e tente novamente." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const { mensagem: message, historico: history } = parsed.data;

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { erro: "Serviço de IA não configurado" },
        { status: 503 },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      {
        role: "model",
        parts: [
          {
            text: "Entendido! Estou pronto para ajudar com questões de sustentabilidade e reciclagem.",
          },
        ],
      },
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    // Nunca lança: falha, tempo esgotado ou resposta inválida viram `null` (502).
    const response = await generateWithHistory(contents, {
      temperature: 0.8,
      maxOutputTokens: 1024,
    });

    if (!response) {
      return NextResponse.json(
        { erro: "Erro ao gerar resposta da IA" },
        { status: 502 },
      );
    }

    return NextResponse.json({ resposta: response });
  } catch (err) {
    return ERRORS.internal("processar chat", err);
  }
}
