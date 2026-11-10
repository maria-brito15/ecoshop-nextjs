// Capacidade OPS — docs/capabilities/operacao/spec.md
import { encerrar, req } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { GET as health } from "@/app/api/health/route";

after(encerrar);

test("REQ-OPS-01: /api/health responde 200 e indica banco e Redis quando ambos estão disponíveis", async () => {
  void req;
  const res = await health();
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.ok, true);
  assert.deepEqual(c.services, { database: true, redis: true });
});

/**
 * REQ-OPS-02 e REQ-OPS-03 rodam o seed real (`npx tsx prisma/seed.ts`) como
 * processo filho, contra o mesmo DATABASE_URL/REDIS_URL deste processo de
 * teste — é o jeito mais fiel de verificar um script que o app não importa
 * (ele tem seu próprio PrismaClient). Pode demorar alguns segundos.
 */
test("REQ-OPS-02: o seed cria usuários com senha utilizável para login (hash bcrypt real)", async () => {
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
    shell: true,
  });

  const admin = await prisma.usuario.findUniqueOrThrow({
    where: { email: "admin@ecoplace.com" },
  });
  const senha = process.env.SEED_USER_PASSWORD ?? "EcoshopDemo@2026";
  assert.equal(await bcrypt.compare(senha, admin.senha), true);
  assert.notEqual(admin.senha, "hash-seguro-aqui");
});

test("REQ-OPS-03: rodar o seed de novo não duplica nem apaga os produtos existentes", async () => {
  // garante que já existe ao menos 1 produto antes de medir idempotência
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
    shell: true,
  });
  const antes = await prisma.produto.count();
  assert.ok(antes > 0, "esperava produtos após o primeiro seed");

  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
    shell: true,
  });
  const depois = await prisma.produto.count();
  assert.equal(depois, antes);
});
