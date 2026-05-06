// app/api/auth/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

// schema de validação do body de login
// garante que o email é válido e a senha tem pelo menos 6 caracteres
// antes mesmo de consultar o banco
const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

// POST /api/auth → faz o login do usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // valida o body sem lançar exceção (safeParse)
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { email, senha } = parsed.data;

    // busca o usuário pelo email no banco
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // propositalmente a mensagem de erro é genérica ("Email ou senha incorretos")
    // não informar qual dos dois está errado dificulta ataques de enumeração de usuários
    if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 },
      );
    }

    // gera o JWT com os dados básicos do usuário (id, email e tipo)
    const token = await signToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
    });

    // monta a resposta com os dados públicos do usuário (sem a senha!)
    const res = NextResponse.json({
      ok: true,
      usuario: { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
    });

    // salva o token em um cookie HttpOnly
    // HttpOnly = o JavaScript do navegador não consegue ler esse cookie, só o servidor
    // isso protege contra ataques XSS que tentam roubar o token
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS obrigatório apenas em produção
      maxAge: 60 * 60 * 24 * 7, // expira em 7 dias (em segundos)
      path: "/", // cookie válido em todas as rotas
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}

// DELETE /api/auth → faz o logout removendo o cookie do navegador
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("token"); // apaga o cookie "token" — sem cookie = sem sessão
  return res;
}
