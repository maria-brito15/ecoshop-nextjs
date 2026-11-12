// app/api/categorias/[id]/route.ts

/**
 * CATEGORY BY ID API ROUTES
 *
 * Endpoints for operations on a specific category.
 *
 * GET /api/categorias/{id} - Fetch category by ID (public)
 * PUT /api/categorias/{id} - Update category (requires ADMIN)
 * DELETE /api/categorias/{id} - Delete category (requires ADMIN)
 *
 * Permissions:
 * - GET: Public
 * - PUT/DELETE: ADMIN only
 *
 * @see services/category.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateCategorySchema } from "@/lib/schemas/category";
import {
  getCategory,
  updateCategory,
  deleteCategory,
} from "@/services/category.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/categorias/{id} - Fetch category by ID
 *
 * @param id - Category ID in the URL
 * @returns { categoria: Category }
 * @status 200 - Category found
 * @status 404 - Category does not exist
 * @status 500 - Error fetching category
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const category = await getCategory(id);
    if (!category) return ERRORS.notFound("Category");
    return NextResponse.json({ categoria: category });
  } catch (err) {
    return ERRORS.internal("fetch category", err);
  }
}

/**
 * PUT /api/categorias/{id} - Update category
 *
 * Requires ADMIN authentication.
 *
 * @param id - Category ID in the URL
 * @body { nome?: string, descricao?: string }
 * @returns { categoria: Category }
 * @status 200 - Category updated
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Category does not exist
 * @status 500 - Error updating category
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
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const category = await updateCategory(id, parsed.data);
    return NextResponse.json({ categoria: category });
  } catch (err) {
    return (
      mapError(err, "Category") ??
      ERRORS.internal("update category", err)
    );
  }
}

/**
 * DELETE /api/categorias/{id} - Delete category
 *
 * Requires ADMIN authentication.
 *
 * ATTENTION: Categories with associated products cannot be deleted.
 *
 * @param id - Category ID in the URL
 * @returns { ok: true }
 * @status 200 - Category deleted
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Category does not exist
 * @status 409 - Category has products (indirectly via Prisma error P2003)
 * @status 500 - Error deleting category
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
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      mapError(err, "Category") ?? ERRORS.internal("delete category", err)
    );
  }
}
