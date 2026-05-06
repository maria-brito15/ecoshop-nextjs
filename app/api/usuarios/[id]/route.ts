// app/api/usuarios/[id]/route.ts — operações em UM usuário específico (por id)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// só permite atualizar nome e telefone — email, senha e tipo têm rotas próprias
const atualizarSchema = z.object({
  nome: z.string().min(1).optional(),
  telefone: z.string().optional(),
});

// GET /api/usuarios/[id] → busca um usuário pelo id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);
    const { id } = await params;

    // regra de acesso: o próprio usuário pode ver seus dados, ou um ADMIN pode ver qualquer um
    if (!session || (session.id !== Number(id) && session.tipo !== "ADMIN")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tipo: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ usuario });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 },
    );
  }
}

// PUT /api/usuarios/[id] → atualiza nome e/ou telefone do usuário
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);
    const { id } = await params;

    // mesma regra: só o próprio usuário ou um ADMIN pode editar
    if (!session || (session.id !== Number(id) && session.tipo !== "ADMIN")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = atualizarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: parsed.data,
      select: { id: true, nome: true, email: true, tipo: true },
    });

    return NextResponse.json({ usuario });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 },
    );
  }
}

// DELETE /api/usuarios/[id] → remove um usuário (só ADMIN pode deletar)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);

    // diferente do GET e PUT: aqui nem o próprio usuário pode se deletar, só ADMIN
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.usuario.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }
}
