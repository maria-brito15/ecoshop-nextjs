import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const certificadoSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  orgaoEmissor: z.string().min(1),
});

export async function GET() {
  try {
    const certificados = await prisma.certificado.findMany({
      orderBy: { nome: "asc" },
    });
    return NextResponse.json({ certificados });
  } catch {
    return NextResponse.json(
      { error: "Erro ao listar certificados" },
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
    const parsed = certificadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const certificado = await prisma.certificado.create({ data: parsed.data });
    return NextResponse.json({ certificado }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar certificado" },
      { status: 500 },
    );
  }
}
