// app/api/categorias/route.ts

/**
 * CATEGORIES API ROUTES
 *
 * Endpoints for managing product categories.
 *
 * GET /api/categorias - List all categories (public)
 * POST /api/categorias - Create a new category (requires ADMIN)
 *
 * Permissions:
 * - GET: Public (any user can see categories)
 * - POST: ADMIN only
 *
 * @see services/category.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { categorySchema } from "@/lib/schemas/category";
import { listCategories, createCategory } from "@/services/category.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/categorias - List all categories
 *
 * @returns { categorias: Category[] }
 * @status 200 - List returned successfully (may be empty)
 * @status 500 - Error fetching categories
 */
export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json({ categorias: categories });
  } catch (err) {
    return ERRORS.internal("listar categorias", err);
  }
}

/**
 * POST /api/categorias - Create a new category
 *
 * Requires ADMIN authentication.
 *
 * @body { nome: string, descricao?: string }
 * @returns { categoria: Category }
 * @status 201 - Category created successfully
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 500 - Error creating category
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const category = await createCategory(parsed.data);
    return NextResponse.json({ categoria: category }, { status: 201 });
  } catch (err) {
    return (
      mapError(err, "Category") ?? ERRORS.internal("create category", err)
    );
  }
}
