// lib/redis.ts

import { createClient, RedisClientType } from "redis";

// mesmo padrão do db.ts: guarda o cliente no globalThis para sobreviver aos hot-reloads do next.js
const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379"; // fallback para desenvolvimento local

  const client = createClient({ url }) as RedisClientType;

  // loga erros de conexão mas não derruba a aplicação — redis é cache, não dado primário
  client.on("error", (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] erro de conexão:", err.message);
    }
  });

  // conecta de forma assíncrona; as chamadas aguardam a conexão automaticamente
  client.connect().catch((err) => {
    console.warn("[redis] falha ao conectar:", err.message);
  });

  return client;
}

// reutiliza a instância existente ou cria uma nova
export const redis = globalForRedis.redis ?? createRedisClient();

// salva no globalThis apenas em desenvolvimento, mesmo motivo do prisma
if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// lê um valor do cache e desserializa o json
// retorna null se a chave não existir ou o redis estiver offline
export async function redisGet<T>(chave: string): Promise<T | null> {
  try {
    const raw = await redis.get(chave);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null; // falha silenciosa — a aplicação continua sem cache
  }
}

// serializa o valor em json e grava com ttl em segundos
export async function redisSet(
  chave: string,
  valor: unknown,
  ttlSegundos: number,
): Promise<void> {
  try {
    await redis.set(chave, JSON.stringify(valor), { EX: ttlSegundos });
  } catch {
    // falha silenciosa — gravar no cache é best-effort
  }
}

// remove uma chave específica
export async function redisDel(chave: string): Promise<void> {
  try {
    await redis.del(chave);
  } catch {
    // falha silenciosa
  }
}

// remove todas as chaves que batem com o padrão (ex: "produtos:*")
// usa scan em vez de keys para não bloquear o servidor em produção
export async function redisDelPattern(padrao: string): Promise<void> {
  try {
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
  } catch {
    // falha silenciosa
  }
}
