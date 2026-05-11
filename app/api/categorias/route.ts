// app/api/categorias/route.ts — opera na coleção (todas as categorias)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { comCache, invalidarCache, chaveCategorias, TTL } from "@/lib/cache";
import { z } from "zod";

const categoriaSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
});

// GET /api/categorias → lista todas as categorias (público, sem autenticação)
export async function GET() {
  try {
    // categorias mudam pouco — ttl de 5 minutos
    const categorias = await comCache(chaveCategorias(), TTL.LISTA_CURTA, () =>
      prisma.categoria.findMany({
        orderBy: { nome: "asc" }, // retorna em ordem alfabética
      }),
    );

    return NextResponse.json({ categorias });
  } catch {
    return NextResponse.json(
      { error: "Erro ao listar categorias" },
      { status: 500 },
    );
  }
}

// POST /api/categorias → cria uma nova categoria (só admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = categoriaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const categoria = await prisma.categoria.create({ data: parsed.data });

    // nova categoria aparece na lista — invalida o cache da coleção
    await invalidarCache("CATEGORIAS");

    return NextResponse.json({ categoria }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 },
    );
  }
}
