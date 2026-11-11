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
 * @see services/photo.service.ts - Lógica de negócio
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import {
  listPhotos,
  uploadPhoto,
  deletePhoto,
  ALLOWED_EXTENSIONS,
} from "@/services/photo.service";
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
  const id = await routeId(params);

  if (id === null) {
    return ERRORS.invalidData("ID inválido");
  }

  try {
    const result = await listPhotos(id);
    return NextResponse.json(result);
  } catch (err) {
    return ERRORS.internal("buscar fotos do produto", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const id = await routeId(params);
  if (id === null)
    return ERRORS.invalidData("ID do produto inválido");

  try {
    const formData = await req.formData();
    const file = formData.get("arquivo") as File | null;
    const customName = formData.get("nome") as string | null;

    if (!file) return ERRORS.invalidData("Nenhum arquivo foi enviado");

    const result = await uploadPhoto({
      produtoId: id,
      arquivo: file,
      nomeCustomizado: customName,
    });

    if (!result.ok) {
      switch (result.reason) {
        case "PRODUTO_NAO_ENCONTRADO":
          return ERRORS.notFound("Produto");
        case "EXTENSAO_NAO_PERMITIDA":
          return ERRORS.invalidData(
            `Tipo de arquivo não permitido. Use: ${ALLOWED_EXTENSIONS.join(", ")}`,
          );
        case "ARQUIVO_MUITO_GRANDE":
          return ERRORS.invalidData("Arquivo muito grande. Máximo: 5MB");
        case "CONTEUDO_NAO_E_IMAGEM":
          return ERRORS.invalidData(
            "O conteúdo do arquivo não é uma imagem JPEG, PNG, GIF ou WebP do tipo indicado pela extensão",
          );
        case "NOME_JA_EXISTE":
          return NextResponse.json(
            { erro: "Um arquivo com este nome já existe" },
            { status: 409 },
          );
        default:
          return ERRORS.internal("fazer upload da foto");
      }
    }

    return NextResponse.json(
      { ok: true, foto: result.photo, mensagem: "Foto enviada com sucesso" },
      { status: 201 },
    );
  } catch (err) {
    return ERRORS.internal("fazer upload da foto", err);
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
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const id = await routeId(params);
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("nome");

  if (id === null)
    return ERRORS.invalidData("ID do produto inválido");
  if (!fileName)
    return ERRORS.invalidData("Nome do arquivo não fornecido");

  try {
    const result = await deletePhoto({
      produtoId: id,
      nomeArquivo: fileName,
    });

    if (!result.ok) {
      switch (result.reason) {
        case "NOME_INVALIDO":
          return ERRORS.invalidData("Nome de arquivo inválido");
        case "ARQUIVO_NAO_ENCONTRADO":
          return ERRORS.notFound("Arquivo");
        default:
          return ERRORS.internal("deletar foto");
      }
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Foto deletada com sucesso",
    });
  } catch (err) {
    return ERRORS.internal("deletar foto", err);
  }
}
