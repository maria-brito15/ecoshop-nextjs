// lib/config/verificar-ambiente.ts

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

import { validarJwtSecret } from "./jwt-secret";

const URL_POSTGRES = /^postgres(ql)?:\/\/\S+$/i;

/** @returns a lista de problemas (vazia se o ambiente de produção está válido). Nunca inclui valores. */
export function problemasDoAmbienteDeProducao(env: NodeJS.ProcessEnv): string[] {
  const problemas: string[] = [];

  const jwt = validarJwtSecret(env.JWT_SECRET);
  if (jwt) problemas.push(jwt);

  if (!env.DATABASE_URL || !URL_POSTGRES.test(env.DATABASE_URL)) {
    problemas.push(
      "DATABASE_URL ausente ou inválida: use uma URL postgresql://usuario:senha@host:porta/banco.",
    );
  }

  return problemas;
}

export function exigirAmbienteDeProducao(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== "production") return;
  if (env.NEXT_PHASE === "phase-production-build") return;

  const problemas = problemasDoAmbienteDeProducao(env);
  if (problemas.length === 0) return;

  for (const problema of problemas) console.error(`❌ [config] ${problema}`);
  console.error("❌ [config] A aplicação não vai iniciar.");
  process.exit(1);
}
