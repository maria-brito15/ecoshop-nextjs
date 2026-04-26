import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { email, senha } = parsed.data;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
    }

    const token = await signToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
    });

    const res = NextResponse.json({
      ok: true,
      usuario: { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("token");
  return res;
}
