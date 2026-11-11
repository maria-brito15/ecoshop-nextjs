/**
 * Spec 011: Redis opcional de verdade, rate limit e cache (ADR-0020; Constitution Art. VIII e IX).
 *
 * Não precisam de banco. Os que usam o Redis real (contagem atômica) precisam de
 * um Redis em REDIS_URL; o resto roda sem nenhum.
 */
import { closeConnections, req } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { redis, withTimeout } from "@/lib/redis";
import {
  rateLimit,
  getClientIp,
  InMemoryCounter,
  type WindowCounter,
} from "@/lib/rate-limit";
import { withCache } from "@/lib/cache";
import { productListKey } from "@/lib/cache/keys";
import { listProductsQuerySchema } from "@/lib/schemas/product";
import { buildHealthReport } from "@/services/health.service";
import { GET as listarProdutosHandler } from "@/app/api/produtos/route";

after(closeConnections);

const single = (base: string) => `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// REQ-OPS-14: Redis fora do ar falha rápido (não pendura a requisição)
// ---------------------------------------------------------------------------

test("REQ-OPS-14: withTimeout releases the waiter when the command does not respond", async () => {
  const start = Date.now();
  await assert.rejects(() => withTimeout(new Promise(() => {}), 50), /did not respond/);
  assert.ok(Date.now() - start < 1000);
  assert.equal(await withTimeout(Promise.resolve("ok"), 50), "ok");
});

test("REQ-OPS-14: with Redis down, cache and rate limit respond fast and without throwing", () => {
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/integration/_redis-down.script.ts"],
    // a inicialização do tsx pode levar dezenas de segundos em disco lento
    { cwd: process.cwd(), encoding: "utf8", timeout: 150_000 },
  );
  assert.equal(child.status, 0, child.stderr);
  const line = child.stdout.split("\n").find((l) => l.startsWith("RESULTADO "));
  assert.ok(line, `no result:
${child.stdout}
${child.stderr}`);
  const r = JSON.parse(line.slice("RESULTADO ".length));

  assert.equal(r.get, null, "GET with Redis down is a miss, not an error");
  for (const ms of r.times) {
    assert.ok(ms < 2500, `operation took ${ms} ms: Redis being down must not hang the request`);
  }
  // REQ-OPS-15: sem Redis, o rate limit continua valendo (memória local)
  assert.equal(r.limit1.blocked, false);
  assert.equal(r.limit2.blocked, true, "the second access exceeds limit 1 and must be blocked");
});

// ---------------------------------------------------------------------------
// REQ-OPS-15: rate limit atômico e com reserva em memória
// ---------------------------------------------------------------------------

test("REQ-OPS-15: the Redis count is born with a TTL (SET NX EX + INCR), no immortal key", async () => {
  const id = single("atomico");
  const config = { limit: 2, windowSeconds: 30 };
  assert.equal((await rateLimit(id, config)).blocked, false);
  assert.equal((await rateLimit(id, config)).blocked, false);
  const third = await rateLimit(id, config);
  assert.equal(third.blocked, true);
  assert.equal(third.remainingAttempts, 0);

  const ttl = await redis.ttl(`rate_limit:${id}`);
  assert.ok(ttl > 0 && ttl <= 30, `a chave precisa ter validade (ttl=${ttl})`);
  await redis.del(`rate_limit:${id}`);
});

test("REQ-OPS-15: if the main counter fails, the in-memory fallback keeps the limit", async () => {
  const broken: WindowCounter = {
    increment: async () => {
      throw new Error("Redis fora");
    },
  };
  const fallback = new InMemoryCounter();
  const config = { limit: 2, windowSeconds: 60 };
  const r1 = await rateLimit("x", config, broken, fallback);
  const r2 = await rateLimit("x", config, broken, fallback);
  const r3 = await rateLimit("x", config, broken, fallback);
  assert.deepEqual([r1.blocked, r2.blocked, r3.blocked], [false, false, true]);
  assert.equal(r1.remainingAttempts, 1);
});

test("REQ-OPS-15: the in-memory counter resets when the window ends", async () => {
  let now = 1_000_000;
  const counter = new InMemoryCounter(() => now);
  assert.equal(await counter.increment("k", 10), 1);
  assert.equal(await counter.increment("k", 10), 2);
  now += 11_000;
  assert.equal(await counter.increment("k", 10), 1);
  assert.equal(await counter.increment("outra", 10), 1);
});

// ---------------------------------------------------------------------------
// REQ-OPS-16: IP do cliente atrás de proxy confiável
// ---------------------------------------------------------------------------

const comXff = (value?: string) =>
  req("/x", { ip: value }) as unknown as Request;
const request = (xff?: string, realIp?: string) =>
  new Request("http://localhost/x", {
    headers: {
      ...(xff ? { "x-forwarded-for": xff } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    },
  });

test("REQ-OPS-16: with 1 trusted proxy, the last x-forwarded-for entry counts (the one the proxy wrote)", () => {
  assert.equal(getClientIp(request("203.0.113.7"), 1), "203.0.113.7");
  // o cliente forjou 9.9.9.9; o proxy acrescentou o IP real no fim
  assert.equal(getClientIp(request("9.9.9.9, 203.0.113.7"), 1), "203.0.113.7");
  assert.equal(getClientIp(request("9.9.9.9, 8.8.8.8, 203.0.113.7"), 1), "203.0.113.7");
});

test("REQ-OPS-16: with 2 trusted proxies the second-to-last entry counts; with more proxies than entries, the first", () => {
  assert.equal(getClientIp(request("1.1.1.1, 2.2.2.2"), 2), "1.1.1.1");
  assert.equal(getClientIp(request("1.1.1.1"), 3), "1.1.1.1");
});

test("REQ-OPS-16: without a trusted proxy the header is ignored; without a header it falls back to x-real-ip or unknown", () => {
  assert.equal(getClientIp(request("9.9.9.9"), 0), "unknown");
  assert.equal(getClientIp(request(undefined, "10.0.0.5"), 1), "10.0.0.5");
  assert.equal(getClientIp(request(), 1), "unknown");
  void comXff;
});

test("REQ-OPS-16: TRUST_PROXY_HOPS sets the default and an invalid value falls back to 1", () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.TRUST_PROXY_HOPS;
  try {
    env.TRUST_PROXY_HOPS = "2";
    assert.equal(getClientIp(request("1.1.1.1, 2.2.2.2")), "1.1.1.1");
    env.TRUST_PROXY_HOPS = "abc";
    assert.equal(getClientIp(request("1.1.1.1, 2.2.2.2")), "2.2.2.2");
    delete env.TRUST_PROXY_HOPS;
    assert.equal(getClientIp(request("1.1.1.1, 2.2.2.2")), "2.2.2.2");
  } finally {
    if (previous === undefined) delete env.TRUST_PROXY_HOPS;
    else env.TRUST_PROXY_HOPS = previous;
  }
});

// ---------------------------------------------------------------------------
// REQ-CAT-10: chave de cache da listagem
// ---------------------------------------------------------------------------

const keyFor = (query: Record<string, string>) =>
  productListKey(listProductsQuerySchema.parse(query));

test("REQ-CAT-10: the key does not depend on parameter order or unknown parameters", () => {
  const a = keyFor({ sort: "preco_asc", page: "2", categoriaId: "3" });
  const b = keyFor({ categoriaId: "3", page: "2", sort: "preco_asc", lixo: "x", outro: "y" });
  assert.equal(a, b);
});

test("REQ-CAT-10: different filters generate different keys; the defaults are part of the key", () => {
  const base = keyFor({});
  assert.match(base, /^products:page=1&size=12&/);
  assert.notEqual(base, keyFor({ page: "2" }));
  assert.notEqual(base, keyFor({ marcaId: "4" }));
  assert.notEqual(base, keyFor({ precoMax: "50" }));
  assert.notEqual(base, keyFor({ sort: "nome_desc" }));
  assert.notEqual(base, keyFor({ nome: "bambu" }));
});

test("REQ-CAT-10: name search ignores case and surrounding spaces (same search, same key)", () => {
  assert.equal(keyFor({ nome: "Bambu" }), keyFor({ nome: "  bambu " }));
  assert.equal(keyFor({ nome: "" }), keyFor({}));
});

test("REQ-CAT-10: a nome above 100 characters returns 400 (the key size is bounded)", async () => {
  const res = await listarProdutosHandler(req(`/api/produtos?nome=${"a".repeat(101)}`));
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// REQ-OPS-17: single-flight
// ---------------------------------------------------------------------------

test("REQ-OPS-17: simultaneous accesses to the same key with an empty cache do a single fetch", async () => {
  const key = `teste:${single("sf")}`;
  let fetches = 0;
  const fetcher = async () => {
    fetches++;
    await new Promise((r) => setTimeout(r, 40));
    return { value: 42 };
  };
  const results = await Promise.all(Array.from({ length: 8 }, () => withCache(key, 5, fetcher)));
  assert.equal(fetches, 1, "the 8 calls should share the same fetch");
  for (const r of results) assert.deepEqual(r, { value: 42 });
  await redis.del(key).catch(() => {});
});

test("REQ-OPS-17: different keys do not mix and a failed fetch does not get stuck", async () => {
  const [a, b] = await Promise.all([
    withCache(`teste:${single("a")}`, 5, async () => "A"),
    withCache(`teste:${single("b")}`, 5, async () => "B"),
  ]);
  assert.deepEqual([a, b], ["A", "B"]);

  const key = `teste:${single("failure")}`;
  await assert.rejects(() => withCache(key, 5, async () => { throw new Error("banco caiu"); }), /banco caiu/);
  assert.equal(await withCache(key, 5, async () => "recuperou"), "recuperou");
  await redis.del(key).catch(() => {});
});

// ---------------------------------------------------------------------------
// REQ-OPS-01 (emenda): saúde com Redis opcional
// ---------------------------------------------------------------------------

test("REQ-OPS-01: database and Redis up → ok (200); only Redis down → degraded (200); database down → unavailable (503)", () => {
  const ok = buildHealthReport({ database: true, redis: true });
  assert.equal(ok.httpStatus, 200);
  assert.equal(ok.relatorio.status, "ok");
  assert.equal(ok.relatorio.ok, true);

  const degraded = buildHealthReport({ database: true, redis: false });
  assert.equal(degraded.httpStatus, 200);
  assert.equal(degraded.relatorio.status, "degradado");
  assert.equal(degraded.relatorio.ok, true);
  assert.deepEqual(degraded.relatorio.services, { database: true, redis: false });

  for (const redisOk of [true, false]) {
    const down = buildHealthReport({ database: false, redis: redisOk });
    assert.equal(down.httpStatus, 503);
    assert.equal(down.relatorio.status, "indisponivel");
    assert.equal(down.relatorio.ok, false);
  }
});
