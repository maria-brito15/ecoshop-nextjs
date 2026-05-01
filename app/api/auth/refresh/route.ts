// app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, tipo: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (usuario.tipo !== session.tipo) {
      const novoToken = await signToken({
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
      });

      const res = NextResponse.json({ ok: true, tipo: usuario.tipo });
      res.cookies.set("token", novoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return res;
    }

    return NextResponse.json({ ok: true, tipo: usuario.tipo });
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return NextResponse.json(
      { error: "Erro ao renovar token" },
      { status: 500 },
    );
  }
}
