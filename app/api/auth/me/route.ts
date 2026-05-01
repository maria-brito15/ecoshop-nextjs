// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ usuario: null }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.id },
    select: { id: true, nome: true, email: true, tipo: true },
  });

  if (!usuario) {
    return NextResponse.json({ usuario: null }, { status: 401 });
  }

  return NextResponse.json({ usuario });
}
