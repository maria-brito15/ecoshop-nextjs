// app/api/produtos/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

type JwtPayload = {
  id: number;
  email: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
};

async function getUsuarioDoToken(req: NextRequest): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

function isAdmin(usuario: JwtPayload | null): boolean {
  return usuario?.tipo === "ADMIN";
}

const atualizarSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  categoriaId: z.number().int().optional(),
  marcaId: z.number().int().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const produto = await prisma.produto.findUnique({
      where: { id: Number(id) },
      include: {
        categoria: true,
        marca: true,
        certificados: { include: { certificado: true } },
      },
    });

    if (!produto) {
      return NextResponse.json(
        { erro: "Produto não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ produto });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao buscar produto" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioDoToken(req);

  if (!usuario) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  if (!isAdmin(usuario)) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = atualizarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: parsed.data,
      include: { categoria: true, marca: true },
    });

    return NextResponse.json({ produto });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao atualizar produto" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioDoToken(req);

  if (!usuario) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  if (!isAdmin(usuario)) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.produto.delete({ where: { id: Number(id) } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { erro: "Produto não encontrado" },
      { status: 404 },
    );
  }
}
