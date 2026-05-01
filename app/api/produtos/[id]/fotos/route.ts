// app/api/produtos/[id]/fotos/route.ts - VERSÃO MELHORADA
// Suporta GET (listar), POST (upload), DELETE (remover)

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

type JwtPayload = {
  id: number;
  email: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
};

const EXTENSOES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5MB

async function getUsuarioDoToken(req: NextRequest): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

function isAdmin(usuario: JwtPayload | null): boolean {
  return usuario?.tipo === "ADMIN";
}

/**
 * GET: Listar todas as fotos de um produto
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pastaFotos = path.join(process.cwd(), "public", "data_fotos", id);
    if (!fs.existsSync(pastaFotos)) {
      return NextResponse.json(
        { fotos: [], total: 0, produtoId: Number(id) },
        { status: 200 },
      );
    }

    const arquivos = fs.readdirSync(pastaFotos);
    const fotos = arquivos
      .filter((arquivo) => {
        const ext = path.extname(arquivo).toLowerCase();
        return EXTENSOES_PERMITIDAS.includes(ext);
      })
      .sort((a, b) => {
        const numA = parseInt(path.basename(a, path.extname(a)), 10);
        const numB = parseInt(path.basename(b, path.extname(b)), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      })
      .map((arquivo) => ({
        nome: arquivo,
        url: `/data_fotos/${id}/${arquivo}`,
      }));

    return NextResponse.json({
      fotos,
      total: fotos.length,
      produtoId: Number(id),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar fotos do produto" },
      { status: 500 },
    );
  }
}

/**
 * POST: Upload de nova foto
 * Suporta FormData com arquivo e nome customizado
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioDoToken(req);
  if (!usuario || !isAdmin(usuario)) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas admins podem fazer upload de fotos." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const produtoId = Number(id);

    if (!id || isNaN(produtoId)) {
      return NextResponse.json(
        { error: "ID do produto inválido" },
        { status: 400 },
      );
    }

    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Ler FormData
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File;
    const nomeCustomizado = formData.get("nome") as string | null;

    if (!arquivo) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 },
      );
    }

    // Validar tipo de arquivo
    const nomeArquivo = arquivo.name;
    const extensao = path.extname(nomeArquivo).toLowerCase();

    if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não permitido. Use: ${EXTENSOES_PERMITIDAS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validar tamanho
    if (arquivo.size > TAMANHO_MAXIMO) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: 5MB` },
        { status: 400 },
      );
    }

    // Criar pasta se não existir
    const pastaFotos = path.join(
      process.cwd(),
      "public",
      "data_fotos",
      String(produtoId),
    );
    if (!fs.existsSync(pastaFotos)) {
      fs.mkdirSync(pastaFotos, { recursive: true });
    }

    // Gerar nome do arquivo
    // Se tiver nome customizado, usar; senão gerar automaticamente
    let nomeArquivoFinal: string;
    if (nomeCustomizado && nomeCustomizado.trim()) {
      // Sanitizar nome
      const nomeSanitizado = nomeCustomizado
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 50);
      nomeArquivoFinal = `${nomeSanitizado}${extensao}`;
    } else {
      // Usar timestamp + número aleatório
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      nomeArquivoFinal = `${timestamp}_${random}${extensao}`;
    }

    // Verificar se arquivo já existe
    const caminhoCompleto = path.join(pastaFotos, nomeArquivoFinal);
    if (fs.existsSync(caminhoCompleto)) {
      return NextResponse.json(
        { error: "Um arquivo com este nome já existe" },
        { status: 409 },
      );
    }

    // Salvar arquivo
    const buffer = await arquivo.arrayBuffer();
    fs.writeFileSync(caminhoCompleto, Buffer.from(buffer));

    // Atualizar fotoUrl do produto se for a primeira foto
    if (!produto.fotoUrl) {
      await prisma.produto.update({
        where: { id: produtoId },
        data: {
          fotoUrl: `/data_fotos/${produtoId}/${nomeArquivoFinal}`,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        foto: {
          nome: nomeArquivoFinal,
          url: `/data_fotos/${produtoId}/${nomeArquivoFinal}`,
        },
        mensagem: "Foto enviada com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao fazer upload de foto:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload da foto" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remover uma foto
 * Query params: ?nome=nome_do_arquivo.jpg
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioDoToken(req);
  if (!usuario || !isAdmin(usuario)) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas admins podem deletar fotos." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const nomeArquivo = searchParams.get("nome");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID do produto inválido" },
        { status: 400 },
      );
    }

    if (!nomeArquivo) {
      return NextResponse.json(
        { error: "Nome do arquivo não fornecido" },
        { status: 400 },
      );
    }

    // Validar nome do arquivo (segurança: evitar path traversal)
    if (nomeArquivo.includes("..") || nomeArquivo.includes("/")) {
      return NextResponse.json(
        { error: "Nome de arquivo inválido" },
        { status: 400 },
      );
    }

    const pastaFotos = path.join(process.cwd(), "public", "data_fotos", id);
    const caminhoCompleto = path.join(pastaFotos, nomeArquivo);

    // Verificar se arquivo existe
    if (!fs.existsSync(caminhoCompleto)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 },
      );
    }

    // Deletar arquivo
    fs.unlinkSync(caminhoCompleto);

    // Se era a foto principal, remover referência
    const produto = await prisma.produto.findUnique({
      where: { id: Number(id) },
    });

    if (produto?.fotoUrl === `/data_fotos/${id}/${nomeArquivo}`) {
      // Listar outras fotos disponíveis
      const outrosFotos = fs.readdirSync(pastaFotos).filter((arquivo) => {
        const ext = path.extname(arquivo).toLowerCase();
        return EXTENSOES_PERMITIDAS.includes(ext);
      });

      if (outrosFotos.length > 0) {
        // Usar primeira foto disponível
        await prisma.produto.update({
          where: { id: Number(id) },
          data: {
            fotoUrl: `/data_fotos/${id}/${outrosFotos[0]}`,
          },
        });
      } else {
        // Nenhuma foto restante
        await prisma.produto.update({
          where: { id: Number(id) },
          data: { fotoUrl: null },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Foto deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar foto:", error);
    return NextResponse.json(
      { error: "Erro ao deletar foto" },
      { status: 500 },
    );
  }
}
