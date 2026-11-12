// Script run as a child process by redis-and-cache.test.ts (not a test:
// its name does not end in .test.ts). Points at a NON-EXISTENT Redis and measures how
// long each operation takes to fail.
process.env.REDIS_URL = "redis://127.0.0.1:1";

import { redisGet, redisSet, redisDel, redisDelPattern } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";

async function measure<T>(fn: () => Promise<T>) {
  const start = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - start };
}

async function main() {
  const get = await measure(() => redisGet("key"));
  const set = await measure(() => redisSet("key", { a: 1 }, 10));
  const del = await measure(() => redisDel("key"));
  const pattern = await measure(() => redisDelPattern("key:*"));
  const config = { limit: 1, windowSeconds: 60 };
  const limit1 = await measure(() => rateLimit("redis-down", config));
  const limit2 = await measure(() => rateLimit("redis-down", config));

  console.log(
    "RESULT " +
      JSON.stringify({
        get: get.value,
        times: [get.ms, set.ms, del.ms, pattern.ms, limit1.ms, limit2.ms],
        limit1: limit1.value,
        limit2: limit2.value,
      }),
  );
  process.exit(0);
}

main();
