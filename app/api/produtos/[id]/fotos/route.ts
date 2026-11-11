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
    return ERRORS.invalidData("Invalid ID");
  }

  try {
    const result = await listPhotos(id);
    return NextResponse.json(result);
  } catch (err) {
    return ERRORS.internal("fetch product photos", err);
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
    return ERRORS.invalidData("Invalid product ID");

  try {
    const formData = await req.formData();
    const file = formData.get("arquivo") as File | null;
    const customName = formData.get("nome") as string | null;

    if (!file) return ERRORS.invalidData("No file was sent");

    const result = await uploadPhoto({
      produtoId: id,
      arquivo: file,
      nomeCustomizado: customName,
    });

    if (!result.ok) {
      switch (result.reason) {
        case "PRODUCT_NOT_FOUND":
          return ERRORS.notFound("Product");
        case "EXTENSION_NOT_ALLOWED":
          return ERRORS.invalidData(
            `File type not allowed. Use: ${ALLOWED_EXTENSIONS.join(", ")}`,
          );
        case "FILE_TOO_LARGE":
          return ERRORS.invalidData("File too large. Maximum: 5MB");
        case "CONTENT_NOT_IMAGE":
          return ERRORS.invalidData(
            "The file content is not a JPEG, PNG, GIF or WebP image matching the extension",
          );
        case "NAME_ALREADY_EXISTS":
          return NextResponse.json(
            { erro: "A file with this name already exists" },
            { status: 409 },
          );
        default:
          return ERRORS.internal("upload the photo");
      }
    }

    return NextResponse.json(
      { ok: true, foto: result.photo, mensagem: "Photo uploaded successfully" },
      { status: 201 },
    );
  } catch (err) {
    return ERRORS.internal("upload the photo", err);
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
    return ERRORS.invalidData("Invalid product ID");
  if (!fileName)
    return ERRORS.invalidData("File name not provided");

  try {
    const result = await deletePhoto({
      produtoId: id,
      nomeArquivo: fileName,
    });

    if (!result.ok) {
      switch (result.reason) {
        case "INVALID_NAME":
          return ERRORS.invalidData("Invalid file name");
        case "FILE_NOT_FOUND":
          return ERRORS.notFound("File");
        default:
          return ERRORS.internal("delete photo");
      }
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Photo deleted successfully",
    });
  } catch (err) {
    return ERRORS.internal("delete photo", err);
  }
}
