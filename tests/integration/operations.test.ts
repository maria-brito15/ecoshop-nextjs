// OPS capability — docs/capabilities/operations/spec.md
import { closeConnections, req } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { GET as health } from "@/app/api/health/route";

after(closeConnections);

test("REQ-OPS-01: /api/health returns 200 and reports database and Redis when both are available", async () => {
  void req;
  const res = await health();
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.ok, true);
  assert.deepEqual(c.services, { database: true, redis: true });
});

/**
 * The seed no longer has an embedded password (REQ-OPS-09): the test supplies it. This value
 * is just test data; it is the same one that databases seeded before 008 use, and the
 * seed does not replace the hash of existing users (upsert with `update: {}`).
 */
const SEED_PASSWORD = "EcoshopDemo@2026";
const ENV_SEED = { ...process.env, SEED_USER_PASSWORD: SEED_PASSWORD };

/**
 * REQ-OPS-02 and REQ-OPS-03 run the real seed (`npx tsx prisma/seed.ts`) as a
 * child process, against the same DATABASE_URL/REDIS_URL as this test
 * process — the most faithful way to verify a script the app does not import
 * (it has its own PrismaClient). It may take a few seconds.
 */
test("REQ-OPS-02: the seed creates users with a usable password for login (real bcrypt hash)", async () => {
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: ENV_SEED,
    stdio: "pipe",
    shell: true,
  });

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@ecoplace.com" },
  });
  assert.equal(await bcrypt.compare(SEED_PASSWORD, admin.password), true);
  assert.notEqual(admin.password, "hash-seguro-aqui");
});

test("REQ-OPS-03: running the seed again neither duplicates nor deletes existing products", async () => {
  // ensures at least 1 product exists before measuring idempotency
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: ENV_SEED,
    stdio: "pipe",
    shell: true,
  });
  const countBefore = await prisma.product.count();
  assert.ok(countBefore > 0, "expected products after the first seed");

  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: process.cwd(),
    env: ENV_SEED,
    stdio: "pipe",
    shell: true,
  });
  const countAfter = await prisma.product.count();
  assert.equal(countAfter, countBefore);
});
