// services/saude.service.ts

/**
 * ============================================================================
 * SAÚDE DA APLICAÇÃO
 * ============================================================================
 * Dependência OBRIGATÓRIA: banco. Dependência OPCIONAL: Redis (cache e rate
 * limit degradam sem ele, ADR-0020). Constitution, Art. XIII.2 / REQ-OPS-01:
 *
 * - banco no ar, Redis no ar      → status "ok"          (HTTP 200)
 * - banco no ar, Redis fora       → status "degradado"   (HTTP 200)
 * - banco fora                    → status "indisponivel" (HTTP 503)
 *
 * Assim o healthcheck do Docker e o deploy não derrubam a aplicação só porque o
 * Redis (opcional) caiu.
 * ============================================================================
 */

import { prisma } from "@/lib/db";
import { redis, comPrazo, TIMEOUT_COMANDO_MS } from "@/lib/redis";

export type StatusDaSaude = "ok" | "degradado" | "indisponivel";

export interface RelatorioDeSaude {
  /** A aplicação consegue atender (o banco responde). */
  ok: boolean;
  status: StatusDaSaude;
  timestamp: string;
  services: { database: boolean; redis: boolean };
}

/** Monta o relatório e o código HTTP a partir do estado de cada dependência. */
export function comporRelatorio(
  services: RelatorioDeSaude["services"],
  agora: Date = new Date(),
): { relatorio: RelatorioDeSaude; httpStatus: 200 | 503 } {
  const status: StatusDaSaude = !services.database
    ? "indisponivel"
    : services.redis
      ? "ok"
      : "degradado";
  const ok = services.database;
  return {
    relatorio: { ok, status, timestamp: agora.toISOString(), services },
    httpStatus: ok ? 200 : 503,
  };
}

async function verificarBanco(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function verificarRedis(): Promise<boolean> {
  try {
    await comPrazo(redis.ping(), TIMEOUT_COMANDO_MS);
    return true;
  } catch {
    return false;
  }
}

/** Consulta as dependências em paralelo e devolve o relatório. */
export async function consultarSaude() {
  const [database, redisOk] = await Promise.all([
    verificarBanco(),
    verificarRedis(),
  ]);
  return comporRelatorio({ database, redis: redisOk });
}
