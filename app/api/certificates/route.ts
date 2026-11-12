// app/api/certificates/route.ts

/**
 * CERTIFICATES API ROUTES
 *
 * Endpoints for managing sustainability certificates.
 *
 * GET /api/certificates - List all certificates (public)
 * POST /api/certificates - Create a new certificate (requires ADMIN)
 *
 * Certificates are seals such as "FSC", "Organic Brazil", "Cruelty Free".
 *
 * @see services/certificate.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { certificateSchema } from "@/lib/schemas/certificate";
import {
  listCertificates,
  createCertificate,
} from "@/services/certificate.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/certificates - List all certificates
 *
 * @returns { certificates: Certificate[] }
 * @status 200 - List returned successfully
 * @status 500 - Error fetching certificates
 */
export async function GET() {
  try {
    const certificates = await listCertificates();
    return NextResponse.json({ certificates });
  } catch (err) {
    return ERRORS.internal("list certificates", err);
  }
}

/**
 * POST /api/certificates - Create a new certificate
 *
 * Requires ADMIN authentication.
 *
 * @body { name: string, description?: string, issuingBody: string }
 * @returns { certificate: Certificate }
 * @status 201 - Certificate created
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 500 - Error creating certificate
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = certificateSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const certificate = await createCertificate(parsed.data);
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err) {
    return (
      mapError(err, "Certificate") ??
      ERRORS.internal("create certificate", err)
    );
  }
}
