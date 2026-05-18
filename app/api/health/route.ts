// app/api/health/route.ts

/**
 * ============================================================================
 * HEALTH CHECK API ROUTE
 * ============================================================================
 * Endpoint para verificar a saúde da aplicação e seus serviços dependentes.
 *
 * GET /api/health - Verifica conectividade com banco e Redis
 *
 * Usado por:
 * - Docker healthcheck (verifica se container está saudável)
 * - Load balancers (para decidir se container recebe tráfego)
 * - Monitoramento (Prometheus, DataDog, etc.)
 *
 * Verificações realizadas:
 * - Database: SELECT 1 (prisma.$queryRaw)
 * - Redis: PING (redis.ping())
 *
 * Se qualquer serviço falhar, status = 503.
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

/**
 * GET /api/health - Health check
 *
 * @returns {
 *   ok: boolean,
 *   timestamp: string,
 *   services: { database: boolean, redis: boolean }
 * }
 * @status 200 - Todos os serviços estão saudáveis
 * @status 503 - Pelo menos um serviço falhou
 */
export async function GET() {
  const health = {
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      database: false,
      redis: false,
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = true;
  } catch {
    health.ok = false;
  }

  try {
    await redis.ping();
    health.services.redis = true;
  } catch {
    health.ok = false;
  }

  const status = health.ok ? 200 : 503;
  return NextResponse.json(health, { status });
}
