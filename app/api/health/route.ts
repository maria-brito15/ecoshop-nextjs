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
import { consultarSaude } from "@/services/saude.service";

export async function GET() {
  const { relatorio, httpStatus } = await consultarSaude();
  return NextResponse.json(relatorio, { status: httpStatus });
}
