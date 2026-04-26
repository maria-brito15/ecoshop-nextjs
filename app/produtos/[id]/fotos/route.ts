import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EXTENSOES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pastaFotos = path.join(process.cwd(), "public", "data_fotos", id);

    if (!fs.existsSync(pastaFotos)) {
      return NextResponse.json(
        { fotos: [], total: 0, produtoId: Number(id) },
        { status: 200 },
      );
    }

    const arquivos = fs.readdirSync(pastaFotos);

    const fotos = arquivos
      .filter((arquivo) => {
        const ext = path.extname(arquivo).toLowerCase();
        return EXTENSOES_PERMITIDAS.includes(ext);
      })
      .sort((a, b) => {
        const numA = parseInt(path.basename(a, path.extname(a)), 10);
        const numB = parseInt(path.basename(b, path.extname(b)), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      })
      .map((arquivo) => ({
        nome: arquivo,
        url: `/data_fotos/${id}/${arquivo}`,
      }));

    return NextResponse.json({
      fotos,
      total: fotos.length,
      produtoId: Number(id),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar fotos do produto" },
      { status: 500 },
    );
  }
}
