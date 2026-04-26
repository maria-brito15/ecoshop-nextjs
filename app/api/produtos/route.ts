import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const produtoSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  preco: z.number().positive(),
  categoriaId: z.number().int(),
  marcaId: z.number().int(),
});

// GET /api/produtos — público
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const size = Number(searchParams.get("size") ?? 12);
    const categoriaId = searchParams.get("categoriaId");
    const nome = searchParams.get("nome");

    const where = {
      ...(categoriaId && { categoriaId: Number(categoriaId) }),
      ...(nome && { nome: { contains: nome, mode: "insensitive" as const } }),
    };

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: {
          categoria: { select: { id: true, nome: true } },
          marca: { select: { id: true, nome: true } },
          certificados: { include: { certificado: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: { id: "asc" },
      }),
      prisma.produto.count({ where }), // ← agora respeita os filtros
    ]);

    return NextResponse.json({ produtos, page, size, total });
  } catch {
    return NextResponse.json({ error: "Erro ao listar produtos" }, { status: 500 });
  }
}

// POST /api/produtos — só ADMIN
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = produtoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const produto = await prisma.produto.create({
      data: parsed.data,
      include: { categoria: true, marca: true },
    });

    return NextResponse.json({ produto }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
