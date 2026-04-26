import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

const chatSchema = z.object({
  mensagem: z.string().min(1).max(2000),
  historico: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .optional()
    .default([]),
});

const SYSTEM_PROMPT = `Você é um assistente especialista em sustentabilidade e reciclagem da EcoShop, uma plataforma de produtos ecológicos. 
Responda de forma clara, educativa e amigável. 
Foque em dicas práticas de reciclagem, sustentabilidade, consumo consciente e produtos ecológicos.
Responda sempre em português brasileiro.
Se a pergunta não for relacionada a sustentabilidade ou ecologia, redirecione gentilmente para o tema.`;

// POST /api/ia/chat — chat conversacional sobre sustentabilidade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mensagem, historico } = parsed.data;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey || apiKey === "sua_chave") {
      return NextResponse.json(
        { error: "Serviço de IA não configurado" },
        { status: 503 }
      );
    }

    // Monta o histórico de conversa com o system prompt no início
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Entendido! Estou pronto para ajudar com dúvidas sobre sustentabilidade e reciclagem." }] },
      ...historico,
      { role: "user", parts: [{ text: mensagem }] },
    ];

    const res = await fetch(`${GEMINI_URL}${apiKey}`, {
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

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao contatar IA" }, { status: 502 });
    }

    const data = await res.json();
    const resposta: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!resposta) {
      return NextResponse.json({ error: "Resposta vazia da IA" }, { status: 502 });
    }

    return NextResponse.json({ resposta });
  } catch {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
