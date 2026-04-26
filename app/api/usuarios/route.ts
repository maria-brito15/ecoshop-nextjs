import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const cadastroSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().optional(),
});

// GET /api/usuarios — só ADMIN
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, telefone: true, tipo: true, criadoEm: true },
    });

    return NextResponse.json({ usuarios });
  } catch {
    return NextResponse.json({ error: "Erro ao listar usuários" }, { status: 500 });
  }
}

// POST /api/usuarios — cadastro público
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cadastroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { nome, email, senha, telefone } = parsed.data;

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const senhaCriptografada = bcrypt.hashSync(senha, 12);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaCriptografada, telefone },
      select: { id: true, nome: true, email: true, tipo: true },
    });

    return NextResponse.json({ usuario }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}
