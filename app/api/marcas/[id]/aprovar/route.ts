// app/api/marcas/[id]/aprovar/route.ts

/**
 * PENDING BRAND APPROVAL
 *
 * POST /api/marcas/{id}/aprovar - Approves a pending brand request (ADMIN)
 *
 * REQ-USR-03, ADR-0018.
 * @see services/brand.service.ts - approveBrand()
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { approveBrand } from "@/services/brand.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * POST /api/marcas/{id}/aprovar - Approves a pending brand
 *
 * Requires ADMIN authentication. Sets `Marca.status` to APROVADA and grants
 * the MARCA type to the associated user.
 *
 * @param id - Brand ID in the URL
 * @returns { marca: Brand }
 * @status 200 - Brand approved
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Brand does not exist
 * @status 409 - Brand is not pending
 * @status 500 - Error approving brand
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const brand = await approveBrand(id);
    return NextResponse.json({ marca: brand });
  } catch (err) {
    return mapError(err, "Brand") ?? ERRORS.internal("approve brand", err);
  }
}
