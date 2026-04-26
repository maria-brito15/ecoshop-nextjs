// app/api/marcas/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const atualizarSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const marca = await prisma.marca.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        produtos: true,
      },
    });

    if (!marca) {
      return NextResponse.json(
        { error: "Marca não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ marca });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar marca" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = atualizarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const marca = await prisma.marca.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json({ marca });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar marca" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.marca.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Marca não encontrada" },
      { status: 404 },
    );
  }
}
