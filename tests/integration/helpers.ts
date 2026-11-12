// tests/integration/helpers.ts
// Integration test utilities (ADR-0016): environment, requests, session and doubles.
// Requires DATABASE_URL (Postgres with migrations applied) and REDIS_URL (Redis).
// IMPORTANT: this file must be the FIRST import of every test: it defines environment variables
// read when the application modules load (e.g. lib/ai/providers/azure-vision).

process.env.JWT_SECRET ??= "test-secret-at-least-32-characters-long";
process.env.AZURE_VISION_ENDPOINT = "https://azure.test/predict";
process.env.AZURE_VISION_KEY = "chave-de-teste-azure-123";
process.env.AI_CONFIDENCE_THRESHOLD = "0.7";

import { NextRequest } from "next/server";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export type Type = "CLIENTE" | "MARCA" | "ADMIN";

/** Unique suffix per run: avoids collisions between files and runs. */
export const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const email = (name: string) => `${name}-${RUN}@test.local`;

export async function createUserDirectly(
  mail: string,
  type: Type = "CLIENTE",
  passwordHash = "hash-qualquer",
) {
  await prisma.usuario.deleteMany({ where: { email: mail } });
  return prisma.usuario.create({
    data: { nome: "Teste " + type, email: mail, senha: passwordHash, tipo: type },
  });
}

export async function cookieDe(u: { id: number; email: string; tipo: Type }) {
  return `token=${await signToken({ id: u.id, email: u.email, tipo: u.tipo })}`;
}

let seq = 0;
/** Distinct simulated IP per request, so the rate limit does not leak between tests. */
export const newIp = () =>
  `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${++seq % 250}`;

export function req(
  url: string,
  opts: {
    method?: string;
    cookie?: string;
    body?: unknown;
    form?: FormData;
    ip?: string;
  } = {},
) {
  const headers: Record<string, string> = {
    "x-forwarded-for": opts.ip ?? newIp(),
  };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (!opts.form && opts.body !== undefined)
    headers["content-type"] = "application/json";
  return new NextRequest(`http://localhost${url}`, {
    method: opts.method ?? "GET",
    headers,
    body:
      opts.form ??
      (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  });
}

export const ctx = (id: number | string) => ({
  params: Promise.resolve({ id: String(id) }),
});

/** Replaces the global fetch (Azure/Gemini) with a double. Returns the restore function. */
export function stubFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init)) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function clearRateLimit() {
  for await (const k of redis.scanIterator({
    MATCH: "rate_limit:*",
    COUNT: 100,
  }))
    await redis.del(k);
}

export async function closeConnections() {
  await prisma.$disconnect();
  await redis.quit().catch(() => {});
}
