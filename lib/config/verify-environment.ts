// lib/config/verify-environment.ts

/**
 * Verificação do ambiente na inicialização do servidor (REQ-OPS-06, REQ-OPS-18;
 * Constitution Art. XII.1 e XII.2).
 *
 * Só roda em produção e fora do `next build` (o build do Docker não tem os
 * segredos). Reúne TODOS os problemas, registra-os e ENCERRA o processo: lançar
 * um erro no hook de inicialização não basta, porque o Next apenas o loga
 * ("Failed to prepare server") e o processo continua vivo.
 *
 * Obrigatórios em produção: `JWT_SECRET` forte e `DATABASE_URL` (PostgreSQL).
 * O Redis é opcional (ADR-0020): `REDIS_URL` ausente não impede o início.
 *
 * Usa `process.exit`, API de Node: só pode ser carregado no runtime `nodejs`
 * (ver `instrumentation.ts`).
 */

import { validateJwtSecret } from "./jwt-secret";

const URL_POSTGRES = /^postgres(ql)?:\/\/\S+$/i;

/** @returns a lista de problemas (vazia se o ambiente de produção está válido). Nunca inclui valores. */
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
