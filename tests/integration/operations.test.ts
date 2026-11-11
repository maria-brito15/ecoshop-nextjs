// Capacidade OPS — docs/capabilities/operacao/spec.md
import { closeConnections, req } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { GET as health } from "@/app/api/health/route";

after(closeConnections);

test("REQ-OPS-01: /api/health responde 200 e indica banco e Redis quando ambos estão disponíveis", async () => {
  void req;
  const res = await health();
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.ok, true);
  assert.deepEqual(c.services, { database: true, redis: true });
});

/**
 * O seed não tem mais senha embutida (REQ-OPS-09): o teste a fornece. Este valor
 * é só um dado de teste; é o mesmo que bancos já semeados antes da 008 usam, e o
 * seed não troca o hash de usuários existentes (upsert com `update: {}`).
 */
const SEED_PASSWORD = "EcoshopDemo@2026";
const ENV_SEED = { ...process.env, SEED_USER_PASSWORD: SEED_PASSWORD };

/**
 * REQ-OPS-02 e REQ-OPS-03 rodam o seed real (`npx tsx prisma/seed.ts`) como
 * processo filho, contra o mesmo DATABASE_URL/REDIS_URL deste processo de
 * teste — é o jeito mais fiel de verificar um script que o app não importa
 * (ele tem seu próprio PrismaClient). Pode demorar alguns segundos.
 */
test("REQ-OPS-02: o seed cria usuários com senha utilizável para login (hash bcrypt real)", async () => {
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: ENV_SEED,
    stdio: "pipe",
    shell: true,
  });

  const admin = await prisma.usuario.findUniqueOrThrow({
    where: { email: "admin@ecoplace.com" },
  });
  assert.equal(await bcrypt.compare(SEED_PASSWORD, admin.senha), true);
  assert.notEqual(admin.senha, "hash-seguro-aqui");
});

test("REQ-OPS-03: rodar o seed de novo não duplica nem apaga os produtos existentes", async () => {
  // garante que já existe ao menos 1 produto antes de medir idempotência
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: ENV_SEED,
    stdio: "pipe",
    shell: true,
  });
  const countBefore = await prisma.produto.count();
  assert.ok(countBefore > 0, "esperava produtos após o primeiro seed");

  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: ENV_SEED,
    stdio: "pipe",
    shell: true,
  });
  const countAfter = await prisma.produto.count();
  assert.equal(countAfter, countBefore);
});
