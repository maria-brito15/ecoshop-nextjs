// app/api/products/[id]/route.ts

/**
 * PRODUCT BY ID API ROUTES
 *
 * Endpoints for operations on a specific product.
 *
 * GET /api/products/{id} - Fetch product by ID (public)
 * PUT /api/products/{id} - Update product (requires ADMIN)
 * DELETE /api/products/{id} - Delete product (requires ADMIN)
 *
 * @see services/product.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateProductSchema } from "@/lib/schemas/product";
import {
  getProduct,
  updateProduct,
  deleteProduct,
} from "@/services/product.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/products/{id} - Fetch product by ID
 *
 * @param id - Product ID in the URL
 * @returns { product: Product }
 * @status 200 - Product found
 * @status 404 - Product does not exist
 * @status 500 - Error fetching product
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const product = await getProduct(id);
    if (!product) return ERRORS.notFound("Product");
    return NextResponse.json({ product });
  } catch (err) {
    return ERRORS.internal("fetch product", err);
  }
}

/**
 * PUT /api/products/{id} - Update product
 *
 * Requires ADMIN authentication.
 *
 * @param id - Product ID in the URL
 * @body { name?: string, description?: string, price?: number, categoryId?: number, brandId?: number, certificateIds?: number[] }
 * @returns { product: Product }
 * @status 200 - Product updated
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Product does not exist
 * @status 500 - Error updating product
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
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const product = await updateProduct(id, parsed.data);
    return NextResponse.json({ product });
  } catch (err) {
    return (
      mapError(err, "Product") ?? ERRORS.internal("update product", err)
    );
  }
}

/**
 * DELETE /api/products/{id} - Delete product
 *
 * Requires ADMIN authentication.
 *
 * @param id - Product ID in the URL
 * @returns { ok: true }
 * @status 200 - Product deleted
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Product does not exist
 * @status 409 - Product has linked certificates (REQ-PROD-07)
 * @status 500 - Error deleting product
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
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      mapError(err, "Product") ?? ERRORS.internal("delete product", err)
    );
  }
}
