import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const marcaSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  usuarioId: z.number().int(),
});

export async function GET() {
  try {
    const marcas = await prisma.marca.findMany({
      orderBy: { nome: "asc" },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
    return NextResponse.json({ marcas });
  } catch {
    return NextResponse.json(
      { error: "Erro ao listar marcas" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = marcaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const marca = await prisma.marca.create({
      data: parsed.data,
      include: { usuario: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({ marca }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar marca" }, { status: 500 });
  }
}
