// app/api/ia/chat/route.ts — chat de texto com IA (Gemini)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// endpoint da API do Gemini (a chave vai no final da URL como query param)
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

const chatSchema = z.object({
  mensagem: z.string().min(1).max(2000),
  // historico = mensagens anteriores da conversa, para o Gemini ter contexto
  // cada item tem role ("user" ou "model") e parts (array de textos)
  historico: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      }),
    )
    .optional()
    .default([]), // se não vier historico, usa array vazio
});

// instrução inicial que define o comportamento e personalidade da IA
// o Gemini não tem campo "system" nativo, então é simulado como a primeira mensagem do "user"
const SYSTEM_PROMPT = `Você é um assistente especialista em sustentabilidade e reciclagem da EcoShop...`;

// POST /api/ia/chat → envia uma mensagem e recebe resposta da IA
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { mensagem, historico } = parsed.data;
    const apiKey = process.env.GEMINI_KEY;

    // verifica se a chave da API foi configurada no .env
    if (!apiKey || apiKey === "sua_chave") {
      return NextResponse.json(
        { error: "Serviço de IA não configurado" },
        { status: 503 }, // 503 Service Unavailable = serviço externo indisponível
      );
    }

    // monta o array de mensagens que será enviado ao Gemini
    // a ordem importa: system prompt → resposta inicial da IA → histórico → nova mensagem
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] }, // 1. instrução do sistema
      { role: "model", parts: [{ text: "Entendido! Estou pronto..." }] }, // 2. IA confirma o papel
      ...historico, // 3. conversa anterior
      { role: "user", parts: [{ text: mensagem }] }, // 4. nova mensagem do usuário
    ];

    const res = await fetch(`${GEMINI_URL}${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8, // criatividade: 0 = determinístico, 1 = muito criativo
          topK: 40, // considera os 40 tokens mais prováveis a cada passo
          topP: 0.95, // limita a massa de probabilidade acumulada (nucleus sampling)
          maxOutputTokens: 1024, // tamanho máximo da resposta
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Erro ao contatar IA" },
        { status: 502 }, // 502 Bad Gateway = servidor externo retornou erro
      );
    }

    const data = await res.json();

    // navega pela estrutura aninhada da resposta do Gemini para pegar o texto
    // usa optional chaining (?.) para não quebrar se algum campo vier undefined
    const resposta: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!resposta) {
      return NextResponse.json(
        { error: "Resposta vazia da IA" },
        { status: 502 },
      );
    }

    return NextResponse.json({ resposta });
  } catch {
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
