// app/api/produtos/[id]/fotos/route.ts

/**
 * PRODUCT PHOTOS API ROUTES
 *
 * Endpoints for managing a product's photos.
 *
 * GET /api/produtos/{id}/fotos - List the product's photos (public)
 * POST /api/produtos/{id}/fotos - Upload a new photo (requires ADMIN)
 * DELETE /api/produtos/{id}/fotos?nome={name} - Delete a photo (requires ADMIN)
 *
 * Photos are stored on the file system (public/data_fotos/).
 *
 * @see services/photo.service.ts - Business logic
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
 * GET /api/produtos/{id}/fotos - List the product's photos
 *
 * @param id - Product ID in the URL
 * @returns { fotos: Photo[], total: number, produtoId: number }
 * @status 200 - List returned
 * @status 400 - Invalid ID
 * @status 500 - Error fetching photos
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
 * POST /api/produtos/{id}/fotos - Photo upload
 *
 * Requires ADMIN authentication.
 *
 * @param id - Product ID in the URL
 * @body FormData with fields:
 *   - arquivo: File (required)
 *   - nome: string (optional, custom name)
 * @returns { ok: true, foto: Photo, mensagem: string }
 * @status 201 - Upload done
 * @status 400 - Invalid data (missing file, disallowed extension, file too large)
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Product not found
 * @status 409 - File name already exists
 * @status 500 - Upload error
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
 * DELETE /api/produtos/{id}/fotos?nome={name} - Delete a photo
 *
 * Requires ADMIN authentication.
 *
 * @param id - Product ID in the URL
 * @query nome - Name of the file to delete
 * @returns { ok: true, mensagem: string }
 * @status 200 - Photo deleted
 * @status 400 - Invalid data (invalid ID, missing name)
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - File not found
 * @status 500 - Error deleting photo
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
