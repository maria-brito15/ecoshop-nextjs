import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const categoriaSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
});

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });
    return NextResponse.json({ categorias });
  } catch {
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = categoriaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const categoria = await prisma.categoria.create({ data: parsed.data });
    return NextResponse.json({ categoria }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
