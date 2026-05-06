// app/api/users/route.ts — rota de REGISTRO PÚBLICO (cadastro + login automático)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth"; // importa signToken pois faz login automático após cadastro
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().optional(),
  senha: z.string().min(8), // mínimo 8 caracteres (mais restritivo)
  tipo: z.enum(["CLIENTE", "MARCA", "ADMIN"]).default("CLIENTE"), // permite definir o tipo na criação
});

// POST /api/users → cadastro público (qualquer pessoa pode chamar, sem autenticação)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { nome, email, telefone, senha, tipo } = parsed.data;

    const existingUser = await prisma.usuario.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }, // 409 Conflict = recurso já existe
      );
    }

    const senhaHash = bcrypt.hashSync(senha, 10); // cost factor 10

    const usuario = await prisma.usuario.create({
      data: { nome, email, telefone, senha: senhaHash, tipo: tipo as any },
    });

    // diferencial desta rota: gera o token e faz login automático após o cadastro
    const token = await signToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
    });

    const res = NextResponse.json(
      {
        ok: true,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
      },
      { status: 201 }, // 201 Created = recurso criado com sucesso
    );

    // define o cookie de sessão igual ao login normal
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Erro ao registrar:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
