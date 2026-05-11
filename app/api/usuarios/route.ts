// app/api/usuarios/route.ts — rota administrativa (listagem e cadastro por admin)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth"; // só getSession, sem signToken (não faz login automático)
import { comCache, invalidarCache, chaveUsuarios, TTL } from "@/lib/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const cadastroSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6), // mínimo 6 caracteres (menos restritivo que a rota pública)
  telefone: z.string().optional(),
  // sem campo "tipo": usuário criado por essa rota sempre será CLIENTE (padrão do banco)
});

// GET /api/usuarios → lista todos os usuários (só admin pode acessar)
// cacheado com ttl curto pois são dados sensíveis que podem mudar a qualquer momento
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.tipo !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const usuarios = await comCache(chaveUsuarios(), TTL.USUARIO, () =>
      prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          tipo: true,
          criadoEm: true,
          // senha nunca é retornada — nem em listagens admin
        },
      }),
    );

    return NextResponse.json({ usuarios });
  } catch {
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 },
    );
  }
}

// POST /api/usuarios → admin cria um usuário manualmente (sem login automático)
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
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 },
      );
    }

    const senhaCriptografada = bcrypt.hashSync(senha, 12); // cost factor 12 (mais seguro que o 10 da rota pública)

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaCriptografada, telefone },
      select: { id: true, nome: true, email: true, tipo: true }, // não retorna a senha
    });

    // novo usuário aparece na listagem — invalida o cache da lista
    await invalidarCache("USUARIOS");

    // não gera token nem seta cookie — admin só cria a conta, não faz login como esse usuário
    return NextResponse.json({ usuario }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 },
    );
  }
}
