// app/api/marcas/route.ts

/**
 * BRANDS API ROUTES
 *
 * Endpoints for managing brands.
 *
 * GET /api/marcas - List all brands (public)
 * POST /api/marcas - Create a new brand (requires ADMIN)
 *
 * Brands represent partner manufacturers/companies.
 * Each brand is associated with a user of type MARCA or ADMIN.
 *
 * @see services/brand.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { brandSchema } from "@/lib/schemas/brand";
import { listBrands, createBrand } from "@/services/brand.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/marcas - List all brands
 *
 * @returns { marcas: Brand[] }
 * @status 200 - List returned successfully
 * @status 500 - Error fetching brands
 */
export async function GET() {
  try {
    const brands = await listBrands();
    return NextResponse.json({ marcas: brands });
  } catch (err) {
    return ERRORS.internal("list brands", err);
  }
}

/**
 * POST /api/marcas - Create a new brand
 *
 * Requires ADMIN authentication.
 *
 * @body { nome: string, descricao?: string, usuarioId: number }
 * @returns { marca: Brand }
 * @status 201 - Brand created
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 500 - Error creating brand
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const brand = await createBrand(parsed.data);
    return NextResponse.json({ marca: brand }, { status: 201 });
  } catch (err) {
    return mapError(err, "Brand") ?? ERRORS.internal("create brand", err);
  }
}
