// app/api/health/route.ts

/**
 * HEALTH CHECK API ROUTE
 *
 * GET /api/health - State of the application and its dependencies (public).
 *
 * Used by the Docker healthcheck and by the deploy verification.
 *
 * @returns { ok, status: "ok" | "degraded" | "unavailable", timestamp, services: { database, redis } }
 * @status 200 - The database responds (Redis down shows up as "degraded")
 * @status 503 - The database does not respond
 *
 * @see services/health.service.ts - Composition rule (REQ-OPS-01)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkHealth } from "@/services/health.service";

export async function GET() {
  const { report, httpStatus } = await checkHealth();
  return NextResponse.json(report, { status: httpStatus });
}
