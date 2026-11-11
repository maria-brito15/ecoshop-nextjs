// app/api/produtos/route.ts

/**
 * PRODUCTS API ROUTES
 *
 * Endpoints for managing products.
 *
 * GET /api/produtos - List products with pagination and filters (public)
 * POST /api/produtos - Create a new product (requires ADMIN)
 *
 * Filters supported on GET:
 * - page: page number (default: 1)
 * - size: items per page (default: 12)
 * - categoriaId: filter by category
 * - marcaId: filter by brand (REQ-CAT-07)
 * - precoMax: maximum price (REQ-CAT-06)
 * - sort: relevancia (default) | preco_asc | preco_desc | nome_asc | nome_desc (REQ-CAT-06)
 * - nome: text search by name
 *
 * @see services/product.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { productSchema, listProductsQuerySchema } from "@/lib/schemas/product";
import { listProducts, createProduct } from "@/services/product.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/produtos - List products with pagination and filters
 *
 * @query page - Page number (default: 1)
 * @query size - Items per page (default: 12)
 * @query categoriaId - Filter by category (optional)
 * @query marcaId - Filter by brand (optional, REQ-CAT-07)
 * @query precoMax - Maximum price (optional, REQ-CAT-06)
 * @query sort - relevancia (default) | preco_asc | preco_desc | nome_asc | nome_desc (REQ-CAT-06)
 * @query nome - Text search (optional, case-insensitive)
 * @returns { produtos: Product[], page: number, size: number, total: number }
 * @status 200 - List returned successfully
 * @status 500 - Error listing products
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listProductsQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const result = await listProducts(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return ERRORS.internal("list products", err);
  }
}

/**
 * POST /api/produtos - Create a new product
 *
 * Requires ADMIN authentication.
 *
 * @body { nome: string, descricao?: string, preco: number, categoriaId: number, marcaId: number }
 * @returns { produto: Product }
 * @status 201 - Product created
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 500 - Error creating product
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const product = await createProduct(parsed.data);
    return NextResponse.json({ produto: product }, { status: 201 });
  } catch (err) {
    return mapError(err, "Product") ?? ERRORS.internal("create product", err);
  }
}
