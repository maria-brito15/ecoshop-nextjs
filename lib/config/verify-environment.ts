// lib/config/verify-environment.ts

/**
 * Environment check at server startup (REQ-OPS-06, REQ-OPS-18;
 * Constitution Art. XII.1 and XII.2).
 *
 * Only runs in production and outside `next build` (the Docker build has no
 * secrets). Collects ALL problems, logs them and ENDS the process: throwing
 * in the startup hook is not enough, because Next only logs it
 * ("Failed to prepare server") and the process stays alive.
 *
 * Required in production: a strong `JWT_SECRET` and `DATABASE_URL` (PostgreSQL).
 * Redis is optional (ADR-0020): a missing `REDIS_URL` does not prevent startup.
 *
 * Uses `process.exit`, a Node API: it may only be loaded in the `nodejs` runtime
 * (see `instrumentation.ts`).
 */

import { validateJwtSecret } from "./jwt-secret";

const URL_POSTGRES = /^postgres(ql)?:\/\/\S+$/i;

/** @returns the list of problems (empty if the production environment is valid). Never includes values. */
export function productionEnvironmentProblems(env: NodeJS.ProcessEnv): string[] {
  const problems: string[] = [];

  const jwt = validateJwtSecret(env.JWT_SECRET);
  if (jwt) problems.push(jwt);

  if (!env.DATABASE_URL || !URL_POSTGRES.test(env.DATABASE_URL)) {
    problems.push(
      "DATABASE_URL is missing or invalid: use a postgresql://user:password@host:port/database URL.",
    );
  }

  return problems;
}

export function requireProductionEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== "production") return;
  if (env.NEXT_PHASE === "phase-production-build") return;

  const problems = productionEnvironmentProblems(env);
  if (problems.length === 0) return;

  for (const problem of problems) console.error(`❌ [config] ${problem}`);
  console.error("❌ [config] The application will not start.");
  process.exit(1);
}
