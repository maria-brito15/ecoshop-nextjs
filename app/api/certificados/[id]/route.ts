// app/api/categorias/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const atualizarSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  orgaoEmissor: z.string().min(1).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const certificado = await prisma.certificado.findUnique({
      where: { id: Number(id) },
    });

    if (!certificado) {
      return NextResponse.json(
        { error: "Certificado não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ certificado });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar certificado" },
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

    const certificado = await prisma.certificado.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json({ certificado });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar certificado" },
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
    await prisma.certificado.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Certificado não encontrado" },
      { status: 404 },
    );
  }
}
