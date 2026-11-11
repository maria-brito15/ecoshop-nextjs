// Roteiro executado como processo filho por redis-and-cache.test.ts (não é um teste:
// o nome não termina em .test.ts). Aponta para um Redis INEXISTENTE e mede quanto
// tempo cada operação leva para falhar.
process.env.REDIS_URL = "redis://127.0.0.1:1";

import { redisGet, redisSet, redisDel, redisDelPattern } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";

async function measure<T>(fn: () => Promise<T>) {
  const start = Date.now();
  const value = await fn();
  return { valor: value, ms: Date.now() - start };
}

async function main() {
  const get = await measure(() => redisGet("chave"));
  const set = await measure(() => redisSet("chave", { a: 1 }, 10));
  const del = await measure(() => redisDel("chave"));
  const pattern = await measure(() => redisDelPattern("chave:*"));
  const config = { limit: 1, windowSeconds: 60 };
  const limit1 = await measure(() => rateLimit("redis-fora", config));
  const limit2 = await measure(() => rateLimit("redis-fora", config));

  console.log(
    "RESULTADO " +
      JSON.stringify({
        get: get.valor,
        tempos: [get.ms, set.ms, del.ms, pattern.ms, limit1.ms, limit2.ms],
        limite1: limit1.valor,
        limite2: limit2.valor,
      }),
  );
  process.exit(0);
}

main();
