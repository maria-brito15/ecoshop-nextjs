// app/api/produtos/[id]/fotos/route.ts

/**
 * ============================================================================
 * PRODUTO FOTOS API ROUTES
 * ============================================================================
 * Endpoints para gerenciamento de fotos de um produto.
 *
 * GET /api/produtos/{id}/fotos - Lista fotos do produto (público)
 * POST /api/produtos/{id}/fotos - Upload de nova foto (requer ADMIN)
 * DELETE /api/produtos/{id}/fotos?nome={nome} - Deleta foto (requer ADMIN)
 *
 * As fotos são armazenadas no sistema de arquivos (public/data_fotos/).
 *
 * @see services/foto.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERROS } from "@/lib/http/responses";
import {
  listarFotos,
  uploadFoto,
  deletarFoto,
  EXTENSOES_PERMITIDAS,
} from "@/services/foto.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/produtos/{id}/fotos - Lista fotos do produto
 *
 * @param id - ID do produto na URL
 * @returns { fotos: Foto[], total: number, produtoId: number }
 * @status 200 - Lista retornada
 * @status 400 - ID inválido
 * @status 500 - Erro ao buscar fotos
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || isNaN(Number(id))) {
    return ERROS.dadosInvalidos("ID inválido");
  }

  try {
    const resultado = await listarFotos(Number(id));
    return NextResponse.json(resultado);
  } catch {
    return ERROS.interno("buscar fotos do produto");
  }
}

/**
 * POST /api/produtos/{id}/fotos - Upload de foto
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID do produto na URL
 * @body FormData com campos:
 *   - arquivo: File (obrigatório)
 *   - nome: string (opcional, nome personalizado)
 * @returns { ok: true, foto: Foto, mensagem: string }
 * @status 201 - Upload realizado
 * @status 400 - Dados inválidos (arquivo ausente, extensão não permitida, arquivo grande)
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Produto não encontrado
 * @status 409 - Nome de arquivo já existe
 * @status 500 - Erro no upload
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  const { id } = await params;
  if (!id || isNaN(Number(id)))
    return ERROS.dadosInvalidos("ID do produto inválido");

  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const nomeCustomizado = formData.get("nome") as string | null;

    if (!arquivo) return ERROS.dadosInvalidos("Nenhum arquivo foi enviado");

    const resultado = await uploadFoto({
      produtoId: Number(id),
      arquivo,
      nomeCustomizado,
    });

    if (!resultado.ok) {
      switch (resultado.motivo) {
        case "PRODUTO_NAO_ENCONTRADO":
          return ERROS.naoEncontrado("Produto");
        case "EXTENSAO_NAO_PERMITIDA":
          return ERROS.dadosInvalidos(
            `Tipo de arquivo não permitido. Use: ${EXTENSOES_PERMITIDAS.join(", ")}`,
          );
        case "ARQUIVO_MUITO_GRANDE":
          return ERROS.dadosInvalidos("Arquivo muito grande. Máximo: 5MB");
        case "NOME_JA_EXISTE":
          return NextResponse.json(
            { erro: "Um arquivo com este nome já existe" },
            { status: 409 },
          );
        default:
          return ERROS.interno("fazer upload da foto");
      }
    }

    return NextResponse.json(
      { ok: true, foto: resultado.foto, mensagem: "Foto enviada com sucesso" },
      { status: 201 },
    );
  } catch {
    return ERROS.interno("fazer upload da foto");
  }
}

/**
 * DELETE /api/produtos/{id}/fotos?nome={nome} - Deleta foto
 *
 * Requer autenticação ADMIN.
 *
 * @param id - ID do produto na URL
 * @query nome - Nome do arquivo a ser deletado
 * @returns { ok: true, mensagem: string }
 * @status 200 - Foto deletada
 * @status 400 - Dados inválidos (ID inválido, nome ausente)
 * @status 401 - Não autenticado
 * @status 403 - Não é ADMIN
 * @status 404 - Arquivo não encontrado
 * @status 500 - Erro ao deletar foto
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErro = await requireAdmin(req);
  if (authErro) return authErro;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const nomeArquivo = searchParams.get("nome");

  if (!id || isNaN(Number(id)))
    return ERROS.dadosInvalidos("ID do produto inválido");
  if (!nomeArquivo)
    return ERROS.dadosInvalidos("Nome do arquivo não fornecido");

  try {
    const resultado = await deletarFoto({
      produtoId: Number(id),
      nomeArquivo,
    });

    if (!resultado.ok) {
      switch (resultado.motivo) {
        case "NOME_INVALIDO":
          return ERROS.dadosInvalidos("Nome de arquivo inválido");
        case "ARQUIVO_NAO_ENCONTRADO":
          return ERROS.naoEncontrado("Arquivo");
        default:
          return ERROS.interno("deletar foto");
      }
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Foto deletada com sucesso",
    });
  } catch {
    return ERROS.interno("deletar foto");
  }
}
