// app/api/health/route.ts

/**
 * ============================================================================
 * HEALTH CHECK API ROUTE
 * ============================================================================
 * GET /api/health - Estado da aplicação e de suas dependências (público).
 *
 * Usado pelo healthcheck do Docker e pela verificação do deploy.
 *
 * @returns { ok, status: "ok" | "degradado" | "indisponivel", timestamp, services: { database, redis } }
 * @status 200 - O banco responde (Redis fora aparece como "degradado")
 * @status 503 - O banco não responde
 *
 * @see services/saude.service.ts - Regra de composição (REQ-OPS-01)
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkHealth } from "@/services/saude.service";

export async function GET() {
  const { relatorio: report, httpStatus } = await checkHealth();
  return NextResponse.json(report, { status: httpStatus });
}
