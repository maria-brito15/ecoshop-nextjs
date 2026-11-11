// lib/rate-limit.ts

/**
 * ============================================================================
 * RATE LIMITING
 * ============================================================================
 * Limita tentativas por identificador (IP, usuário) numa janela de tempo.
 *
 * - Contagem no Redis, de forma ATÔMICA (REQ-OPS-15): `SET chave 0 EX janela NX`
 *   seguido de `INCR` numa transação. O TTL nasce junto com a chave; antes, um
 *   `INCR` e um `EXPIRE` separados deixavam a chave sem validade se o processo
 *   caísse entre os dois, bloqueando o identificador para sempre.
 * - Sem Redis (ADR-0020, decisão do dono): usa um contador EM MEMÓRIA do próprio
 *   processo. O limite vale por instância (com várias instâncias, cada uma conta
 *   separado) e é perdido ao reiniciar — melhor que liberar tudo.
 * - IP do cliente (REQ-OPS-16): `x-forwarded-for` só é confiável a partir do
 *   proxy reverso; o primeiro valor é escrito pelo cliente e pode ser forjado.
 *   Pega-se o valor na posição indicada por `TRUST_PROXY_HOPS` (padrão 1).
 * ============================================================================
 */

import { redis, withTimeout, COMMAND_TIMEOUT_MS, warnRedisFailure } from "@/lib/redis";

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

/** Conta ocorrências de uma chave dentro de uma janela. */
export interface WindowCounter {
  /** Soma 1 à chave e devolve o total na janela atual. */
  increment(key: string, windowSeconds: number): Promise<number>;
}

class RedisCounter implements WindowCounter {
  async increment(key: string, windowSeconds: number): Promise<number> {
    const response = (await withTimeout(
      redis
        .multi()
        .set(key, 0, { EX: windowSeconds, NX: true })
        .incr(key)
        .exec(),
      COMMAND_TIMEOUT_MS,
    )) as unknown[];
    const total = Number(response[1]);
    if (!Number.isFinite(total)) throw new Error("unexpected Redis response");
    return total;
  }
}

/** Contador local do processo (reserva quando o Redis falha). */
export class InMemoryCounter implements WindowCounter {
  private readonly entradas = new Map<string, { total: number; expiraEm: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async increment(key: string, windowSeconds: number): Promise<number> {
    const t = this.now();
    this.purgeExpired(t);
    const current = this.entradas.get(key);
    if (!current || current.expiraEm <= t) {
      this.entradas.set(key, { total: 1, expiraEm: t + windowSeconds * 1000 });
      return 1;
    }
    current.total += 1;
    return current.total;
  }

  /** Só varre quando o mapa cresce, para não custar nada no caso comum. */
  private purgeExpired(t: number) {
    if (this.entradas.size < 1000) return;
    for (const [key, e] of this.entradas) if (e.expiraEm <= t) this.entradas.delete(key);
  }
}

const redisCounter = new RedisCounter();
const localCounter = new InMemoryCounter();

/**
 * Registra uma tentativa e informa se o identificador passou do limite.
 *
 * @param counter - Contador principal (padrão: Redis)
 * @param fallback - Usado quando o principal falha (padrão: memória local)
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
  counter: WindowCounter = redisCounter,
  fallback: WindowCounter = localCounter,
): Promise<{ blocked: boolean; remainingAttempts: number }> {
  const key = `rate_limit:${identifier}`;

  let attempts: number;
  try {
    attempts = await counter.increment(key, config.windowSeconds);
  } catch (err) {
    warnRedisFailure("rate_limit.redis_unavailable_using_memory", err);
    attempts = await fallback.increment(key, config.windowSeconds);
  }

  return {
    blocked: attempts > config.limit,
    remainingAttempts: Math.max(0, config.limit - attempts),
  };
}

/**
 * Quantos proxies confiáveis existem à frente da aplicação (variável
 * `TRUST_PROXY_HOPS`; padrão 1: um proxy reverso, como no compose de publicação).
 */
function proxyHops(): number {
  const value = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  return Number.isInteger(value) && value >= 0 ? value : 1;
}

/**
 * IP do cliente para rate limit.
 *
 * Com N proxies confiáveis, o IP real é a N-ésima entrada contada do FIM de
 * `x-forwarded-for` (cada proxy acrescenta a que viu); entradas anteriores são do
 * cliente e podem ser forjadas. Com 0 proxies o cabeçalho é ignorado (todos caem
 * no mesmo balde "unknown": mais restritivo, porém não burlável).
 */
export function getClientIp(
  req: Request,
  hops: number = proxyHops(),
): string {
  if (hops === 0) return "unknown";
  const entries = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (entries.length > 0) {
    return entries[Math.max(0, entries.length - hops)];
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
