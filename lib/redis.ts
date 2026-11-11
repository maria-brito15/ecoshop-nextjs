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
import { log, serializarErro, limitarFrequencia } from "@/lib/log";

/** Tempo limite de um comando comum (valor inicial, sem medição). */
export const TIMEOUT_COMANDO_MS = 300;
/** Varrer chaves por padrão é mais lento: tem prazo próprio. */
const TIMEOUT_VARREDURA_MS = 3000;
const FILA_OFFLINE_MAXIMA = 100;

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

const podeAvisar = limitarFrequencia(30_000);

/** Registra a falha do Redis, no máximo uma vez a cada 30 s por tipo. */
export function avisarFalhaDoRedis(evento: string, err: unknown) {
  if (podeAvisar(evento)) log.warn(evento, { erro: serializarErro(err) });
}

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = createClient({
    url,
    commandsQueueMaxLength: FILA_OFFLINE_MAXIMA,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: (tentativas: number) => Math.min(tentativas * 200, 5000),
    },
  }) as RedisClientType;

  client.on("error", (err) => avisarFalhaDoRedis("redis.erro_de_conexao", err));

  client
    .connect()
    .catch((err) => avisarFalhaDoRedis("redis.falha_ao_conectar", err));

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
export function comPrazo<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeita) => {
    temporizador = setTimeout(
      () => rejeita(new Error(`Redis sem resposta em ${ms} ms`)),
      ms,
    );
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(temporizador));
}

/**
 * Lê e converte um valor do cache.
 * @returns o valor, ou `null` se não existe ou se o Redis falhou
 */
export async function redisGet<T>(chave: string): Promise<T | null> {
  try {
    const raw = await comPrazo(redis.get(chave), TIMEOUT_COMANDO_MS);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    avisarFalhaDoRedis("redis.get_falhou", err);
    return null;
  }
}

/** Grava um valor com TTL. Falha do Redis não propaga. */
export async function redisSet(
  chave: string,
  valor: unknown,
  ttlSegundos: number,
): Promise<void> {
  try {
    await comPrazo(
      redis.set(chave, JSON.stringify(valor), { EX: ttlSegundos }),
      TIMEOUT_COMANDO_MS,
    );
  } catch (err) {
    avisarFalhaDoRedis("redis.set_falhou", err);
  }
}

/** Remove uma chave. Falha do Redis não propaga. */
export async function redisDel(chave: string): Promise<void> {
  try {
    await comPrazo(redis.del(chave), TIMEOUT_COMANDO_MS);
  } catch (err) {
    avisarFalhaDoRedis("redis.del_falhou", err);
  }
}

/** Remove todas as chaves que casam com o padrão (ex.: `produtos:*`). Falha não propaga. */
export async function redisDelPattern(padrao: string): Promise<void> {
  try {
    await comPrazo(
      (async () => {
        const chaves: string[] = [];
        for await (const chave of redis.scanIterator({
          MATCH: padrao,
          COUNT: 100,
        })) {
          chaves.push(chave);
        }
        if (chaves.length > 0) {
          await redis.del(chaves);
        }
      })(),
      TIMEOUT_VARREDURA_MS,
    );
  } catch (err) {
    avisarFalhaDoRedis("redis.del_pattern_falhou", err);
  }
}
