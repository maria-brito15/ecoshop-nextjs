// app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/auth/refresh → renova o token do usuário se necessário
// chamada útil quando o frontend precisa verificar se a sessão ainda é válida
// ou se o tipo do usuário mudou (ex: um cliente que virou admin)
export async function POST(req: NextRequest) {
  try {
    // tenta ler e verificar o token do cookie atual
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // busca o usuário no banco para pegar os dados mais atualizados
    // select: evita trazer campos desnecessários como a senha
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, tipo: true },
    });

    // usuário pode ter sido deletado do banco após o login
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // verifica se o tipo do usuário mudou desde que o token foi gerado
    // ex: era "CLIENTE" no token mas agora é "ADMIN" no banco
    // nesse caso é necessário gerar um novo token com o tipo atualizado
    if (usuario.tipo !== session.tipo) {
      const novoToken = await signToken({
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo, // tipo atualizado do banco, não do token antigo
      });

      const res = NextResponse.json({ ok: true, tipo: usuario.tipo });

      // substitui o cookie com o novo token (mesmas configurações do login)
      res.cookies.set("token", novoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return res;
    }

    // tipo não mudou: token ainda é válido, só confirma o tipo atual
    return NextResponse.json({ ok: true, tipo: usuario.tipo });
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return NextResponse.json(
      { error: "Erro ao renovar token" },
      { status: 500 },
    );
  }
}
