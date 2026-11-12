// services/health.service.ts

/**
 * APPLICATION HEALTH
 *
 * REQUIRED dependency: database. OPTIONAL dependency: Redis (cache and rate
 * limit degrade without it, ADR-0020). Constitution, Art. XIII.2 / REQ-OPS-01:
 *
 * - database up, Redis up    → status "ok"          (HTTP 200)
 * - database up, Redis down  → status "degraded"   (HTTP 200)
 * - database down            → status "unavailable" (HTTP 503)
 *
 * This way the Docker healthcheck and the deploy do not take the application
 * down just because Redis (optional) went down.
 */

import { prisma } from "@/lib/db";
import { redis, withTimeout, COMMAND_TIMEOUT_MS } from "@/lib/redis";

export type HealthStatus = "ok" | "degraded" | "unavailable";

export interface HealthReport {
  /** The application can serve requests (the database responds). */
  ok: boolean;
  status: HealthStatus;
  timestamp: string;
  services: { database: boolean; redis: boolean };
}

/** Builds the report and the HTTP code from the state of each dependency. */
export function buildHealthReport(
  services: HealthReport["services"],
  now: Date = new Date(),
): { report: HealthReport; httpStatus: 200 | 503 } {
  const status: HealthStatus = !services.database
    ? "unavailable"
    : services.redis
      ? "ok"
      : "degraded";
  const ok = services.database;
  return {
    report: { ok, status, timestamp: now.toISOString(), services },
    httpStatus: ok ? 200 : 503,
  };
}

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    await withTimeout(redis.ping(), COMMAND_TIMEOUT_MS);
    return true;
  } catch {
    return false;
  }
}

/** Queries the dependencies in parallel and returns the report. */
export async function checkHealth() {
  const [database, redisOk] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);
  return buildHealthReport({ database, redis: redisOk });
}
