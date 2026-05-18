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
import { ERROS } from "@/lib/http/responses";
import { chatSchema } from "@/lib/schemas/ia-chat";
import { gerarTexto, GEMINI_MODEL } from "@/lib/ai/providers/gemini-chat";

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
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) return ERROS.dadosInvalidos(parsed.error.flatten());

    const { mensagem, historico } = parsed.data;

    const geminiKey = process.env.GEMINI_KEY ?? "";
    if (!geminiKey || geminiKey === "sua_chave") {
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
      ...historico,
      { role: "user", parts: [{ text: mensagem }] },
    ];

    const resposta = await gerarTextoWithHistory(contents, geminiKey);

    if (!resposta) {
      return NextResponse.json(
        { erro: "Erro ao gerar resposta da IA" },
        { status: 502 },
      );
    }

    return NextResponse.json({ resposta });
  } catch {
    return ERROS.interno("processar chat");
  }
}

async function gerarTextoWithHistory(
  contents: unknown[],
  apiKey: string,
): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}
