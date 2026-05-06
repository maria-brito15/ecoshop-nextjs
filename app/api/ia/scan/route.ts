// app/api/ia/scan/route.ts — análise de imagem com IA (visão computacional)

import { NextRequest, NextResponse } from "next/server";
import { analisarImagem } from "@/lib/ai"; // função que faz a análise, definida em lib/ai.ts

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB em bytes (10 × 1024 × 1024)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// POST /api/ia/scan → recebe uma imagem e retorna análise de sustentabilidade
export async function POST(req: NextRequest) {
  try {
    // FormData é o formato usado para upload de arquivos (diferente de req.json())
    const formData = await req.formData();
    const file = formData.get("image") as File | null; // pega o campo "image" do form

    if (!file) {
      return NextResponse.json(
        { error: "Nenhuma imagem enviada" },
        { status: 400 },
      );
    }

    // valida o tipo do arquivo pelo MIME type (não pela extensão, que pode ser alterada)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use: jpg, jpeg, png, gif ou webp" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx: 10MB)" },
        { status: 400 },
      );
    }

    // converte o arquivo para Buffer (formato que o Node.js usa para dados binários)
    // arrayBuffer → Buffer é necessário pois a API do Gemini espera dados binários
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // gera um id único para essa análise combinando timestamp + string aleatória
    // ex: "analise_1714000000000_k3j8f2a1"
    const imageId = `analise_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const resultado = await analisarImagem(buffer, imageId);

    // se a análise falhou (sucesso: false), retorna 422 Unprocessable Entity
    // se deu certo, retorna 200 com o resultado
    return NextResponse.json(resultado, {
      status: resultado.sucesso ? 200 : 422,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar análise" },
      { status: 500 },
    );
  }
}
