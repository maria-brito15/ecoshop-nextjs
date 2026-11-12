// app/api/marcas/[id]/route.ts

/**
 * BRAND BY ID API ROUTES
 *
 * Endpoints for operations on a specific brand.
 *
 * GET /api/marcas/{id} - Fetch brand by ID (public)
 * PUT /api/marcas/{id} - Update brand (requires ADMIN)
 * DELETE /api/marcas/{id} - Delete brand (requires ADMIN)
 *
 * @see services/brand.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateBrandSchema } from "@/lib/schemas/brand";
import {
  getBrand,
  updateBrand,
  deleteBrand,
} from "@/services/brand.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/marcas/{id} - Fetch brand by ID
 *
 * @param id - Brand ID in the URL
 * @returns { marca: Brand }
 * @status 200 - Brand found
 * @status 404 - Brand does not exist
 * @status 500 - Error fetching brand
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const brand = await getBrand(id);
    if (!brand) return ERRORS.notFound("Brand");
    return NextResponse.json({ marca: brand });
  } catch (err) {
    return ERRORS.internal("fetch brand", err);
  }
}

/**
 * PUT /api/marcas/{id} - Update brand
 *
 * Requires ADMIN authentication.
 * NOTE: usuarioId CANNOT be changed after creation.
 *
 * @param id - Brand ID in the URL
 * @body { nome?: string, descricao?: string }
 * @returns { marca: Brand }
 * @status 200 - Brand updated
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Brand does not exist
 * @status 500 - Error updating brand
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const body = await req.json();
    const parsed = updateBrandSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const brand = await updateBrand(id, parsed.data);
    return NextResponse.json({ marca: brand });
  } catch (err) {
    return mapError(err, "Brand") ?? ERRORS.internal("update brand", err);
  }
}

/**
 * DELETE /api/marcas/{id} - Delete brand
 *
 * Requires ADMIN authentication.
 *
 * ATTENTION: Brands with associated products cannot be deleted.
 *
 * @param id - Brand ID in the URL
 * @returns { ok: true }
 * @status 200 - Brand deleted
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Brand does not exist
 * @status 500 - Error deleting brand
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    await deleteBrand(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mapError(err, "Brand") ?? ERRORS.internal("delete brand", err);
  }
}
