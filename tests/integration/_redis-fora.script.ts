// Roteiro executado como processo filho por redis-e-cache.test.ts (não é um teste:
// o nome não termina em .test.ts). Aponta para um Redis INEXISTENTE e mede quanto
// tempo cada operação leva para falhar.
process.env.REDIS_URL = "redis://127.0.0.1:1";

import { redisGet, redisSet, redisDel, redisDelPattern } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";

async function medir<T>(fn: () => Promise<T>) {
  const inicio = Date.now();
  const valor = await fn();
  return { valor, ms: Date.now() - inicio };
}

async function main() {
  const get = await medir(() => redisGet("chave"));
  const set = await medir(() => redisSet("chave", { a: 1 }, 10));
  const del = await medir(() => redisDel("chave"));
  const padrao = await medir(() => redisDelPattern("chave:*"));
  const config = { limit: 1, windowSeconds: 60 };
  const limite1 = await medir(() => rateLimit("redis-fora", config));
  const limite2 = await medir(() => rateLimit("redis-fora", config));

  console.log(
    "RESULTADO " +
      JSON.stringify({
        get: get.valor,
        tempos: [get.ms, set.ms, del.ms, padrao.ms, limite1.ms, limite2.ms],
        limite1: limite1.valor,
        limite2: limite2.valor,
      }),
  );
  process.exit(0);
}

main();
