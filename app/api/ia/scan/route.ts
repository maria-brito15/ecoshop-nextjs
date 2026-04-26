import { NextRequest, NextResponse } from "next/server";
import { analisarImagem } from "@/lib/ai";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// POST /api/ia/scan — recebe uma imagem e retorna análise de sustentabilidade
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhuma imagem enviada" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use: jpg, jpeg, png, gif ou webp" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx: 10MB)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gera um ID único para a análise (sem salvar no disco — stateless)
    const imageId = `analise_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const resultado = await analisarImagem(buffer, imageId);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 422 });
  } catch {
    return NextResponse.json({ error: "Erro ao processar análise" }, { status: 500 });
  }
}
