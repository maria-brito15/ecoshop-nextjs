// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { comCache, redisDel, chaveUsuarioMe, TTL } from "@/lib/cache";

// GET /api/auth/me → retorna os dados do usuário logado a partir do token no cookie
// cacheado por id de sessão com ttl curto — cada usuário tem sua própria entrada no redis
export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ usuario: null }, { status: 401 });
  }

  // chave inclui o id do usuário para não misturar sessões de usuários diferentes
  const usuario = await comCache(chaveUsuarioMe(session.id), TTL.USUARIO, () =>
    prisma.usuario.findUnique({
      where: { id: session.id },
      select: { id: true, nome: true, email: true, tipo: true },
    }),
  );

  if (!usuario) {
    return NextResponse.json({ usuario: null }, { status: 401 });
  }

  return NextResponse.json({ usuario });
}

// re-exporta a função de invalidação para ser usada no put de /api/usuarios/[id]
// evita importar o redis diretamente nas outras rotas
export { redisDel, chaveUsuarioMe };
