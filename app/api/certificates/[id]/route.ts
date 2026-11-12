// app/api/certificados/[id]/route.ts

/**
 * CERTIFICATE BY ID API ROUTES
 *
 * Endpoints for operations on a specific certificate.
 *
 * GET /api/certificados/{id} - Fetch certificate by ID (public)
 * PUT /api/certificados/{id} - Update certificate (requires ADMIN)
 * DELETE /api/certificados/{id} - Delete certificate (requires ADMIN)
 *
 * @see services/certificate.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateCertificateSchema } from "@/lib/schemas/certificate";
import {
  getCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/services/certificate.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/certificados/{id} - Fetch certificate by ID
 *
 * @param id - Certificate ID in the URL
 * @returns { certificado: Certificate }
 * @status 200 - Certificate found
 * @status 404 - Certificate does not exist
 * @status 500 - Error fetching certificate
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    const certificate = await getCertificate(id);
    if (!certificate) return ERRORS.notFound("Certificate");
    return NextResponse.json({ certificado: certificate });
  } catch (err) {
    return ERRORS.internal("fetch certificate", err);
  }
}

/**
 * PUT /api/certificados/{id} - Update certificate
 *
 * Requires ADMIN authentication.
 *
 * @param id - Certificate ID in the URL
 * @body { nome?: string, descricao?: string, orgaoEmissor?: string }
 * @returns { certificado: Certificate }
 * @status 200 - Certificate updated
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Certificate does not exist
 * @status 500 - Error updating certificate
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
    const parsed = updateCertificateSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const certificate = await updateCertificate(id, parsed.data);
    return NextResponse.json({ certificado: certificate });
  } catch (err) {
    return (
      mapError(err, "Certificate") ??
      ERRORS.internal("update certificate", err)
    );
  }
}

/**
 * DELETE /api/certificados/{id} - Delete certificate
 *
 * Requires ADMIN authentication.
 *
 * ATTENTION: Certificates linked to products cannot be deleted.
 *
 * @param id - Certificate ID in the URL
 * @returns { ok: true }
 * @status 200 - Certificate deleted
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 404 - Certificate does not exist
 * @status 500 - Error deleting certificate
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
    await deleteCertificate(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      mapError(err, "Certificate") ??
      ERRORS.internal("delete certificate", err)
    );
  }
}
