// lib/redis.ts

/**
 * ============================================================================
 * REDIS CLIENT
 * ============================================================================
 * Cliente Redis compartilhado (cache e rate limit). O Redis é OPCIONAL: sem ele
 * a aplicação segue funcionando, com cache e rate limit degradados (ADR-0020).
 *
 * Falha rápida (REQ-OPS-14): o node-redis enfileira comandos enquanto está
 * desconectado e, sem limite, uma requisição ficaria pendurada até a
 * reconexão. Por isso:
 * - todo comando tem tempo limite (`comPrazo`); estourado, vale como falha;
 * - a fila offline tem tamanho máximo;
 * - a conexão tem tempo limite e a reconexão recua de 200 ms até 5 s.
 *
 * As funções `redisGet/Set/Del/DelPattern` nunca lançam: falha vira "miss"
 * (ou no-op) e é registrada no máximo uma vez a cada 30 s.
 * ============================================================================
 */

import { createClient, RedisClientType } from "redis";
import { log, serializeError, throttle } from "@/lib/log";

/** Tempo limite de um comando comum (valor inicial, sem medição). */
export const COMMAND_TIMEOUT_MS = 300;
/** Varrer chaves por padrão é mais lento: tem prazo próprio. */
const SCAN_TIMEOUT_MS = 3000;
const MAX_OFFLINE_QUEUE = 100;

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

const canWarn = throttle(30_000);

/** Registra a falha do Redis, no máximo uma vez a cada 30 s por tipo. */
export function warnRedisFailure(event: string, err: unknown) {
  if (canWarn(event)) log.warn(event, { error: serializeError(err) });
}

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = createClient({
    url,
    commandsQueueMaxLength: MAX_OFFLINE_QUEUE,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: (attempts: number) => Math.min(attempts * 200, 5000),
    },
  }) as RedisClientType;

  client.on("error", (err) => warnRedisFailure("redis.connection_error", err));

  client
    .connect()
    .catch((err) => warnRedisFailure("redis.connect_failed", err));

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Rejeita se `promessa` não terminar em `ms`. A promessa original continua (o
 * Redis não cancela comandos), mas quem espera é liberado.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, rejects) => {
    timer = setTimeout(
      () => rejects(new Error(`Redis did not respond within ${ms} ms`)),
      ms,
    );
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

/**
 * Lê e converte um valor do cache.
 * @returns o valor, ou `null` se não existe ou se o Redis falhou
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await withTimeout(redis.get(key), COMMAND_TIMEOUT_MS);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    warnRedisFailure("redis.get_failed", err);
    return null;
  }
}

/** Grava um valor com TTL. Falha do Redis não propaga. */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    await withTimeout(
      redis.set(key, JSON.stringify(value), { EX: ttlSeconds }),
      COMMAND_TIMEOUT_MS,
    );
  } catch (err) {
    warnRedisFailure("redis.set_failed", err);
  }
}

/** Remove uma chave. Falha do Redis não propaga. */
export async function redisDel(key: string): Promise<void> {
  try {
    await withTimeout(redis.del(key), COMMAND_TIMEOUT_MS);
  } catch (err) {
    warnRedisFailure("redis.del_failed", err);
  }
}

/** Remove todas as chaves que casam com o padrão (ex.: `produtos:*`). Falha não propaga. */
export async function redisDelPattern(pattern: string): Promise<void> {
  try {
    await withTimeout(
      (async () => {
        const keys: string[] = [];
        for await (const key of redis.scanIterator({
          MATCH: pattern,
          COUNT: 100,
        })) {
          keys.push(key);
        }
        if (keys.length > 0) {
          await redis.del(keys);
        }
      })(),
      SCAN_TIMEOUT_MS,
    );
  } catch (err) {
    warnRedisFailure("redis.del_pattern_failed", err);
  }
}
