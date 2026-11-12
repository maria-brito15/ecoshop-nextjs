/**
 * Safe operation (spec 008): startup behavior and what the repository
 * delivers to run and publish the system.
 *
 * Needs neither a database nor Redis: validates pure functions and reads versioned files
 * (compose, workflow, scripts). What requires Docker or a build runs in CI (see ci.yml).
 */
import { email, closeConnections } from "./helpers";
import test, { after, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { validateJwtSecret } from "@/lib/config/jwt-secret";
import { register } from "@/instrumentation";

after(closeConnections);

const VALID_SECRET ="x7Qm2LbR9vTn4KcE8wYpZa3JdHfUg6Nz";

type Environment = Record<string, string | undefined>;

/** Runs `fn` with changed environment variables and restores everything at the end. */
async function withEnvironment(changes: Environment, fn: () => Promise<void>) {
  const env = process.env as Environment;
  const previous: Environment = {};
  for (const key of Object.keys(changes)) {
    previous[key] = env[key];
    if (changes[key] === undefined) delete env[key];
    else env[key] = changes[key];
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(previous)) {
      if (previous[key] === undefined) delete env[key];
      else env[key] = previous[key];
    }
  }
}

const PRODUCTION: Environment = {
  NODE_ENV: "production",
  NEXT_RUNTIME: "nodejs",
  DATABASE_URL: "postgresql://user:password@host:5432/database",
  NEXT_PHASE: undefined,
};

test("REQ-OPS-06: validateJwtSecret accepts a secret with 32+ characters that is not a sample value", () => {
  assert.equal(validateJwtSecret(VALID_SECRET), null);
});

test("REQ-OPS-06: validateJwtSecret refuses a missing, empty or short secret", () => {
  assert.notEqual(validateJwtSecret(undefined), null);
  assert.notEqual(validateJwtSecret(""), null);
  assert.notEqual(validateJwtSecret("a".repeat(31)), null);
  assert.equal(validateJwtSecret("a1B2".repeat(8)), null);
});

test("REQ-OPS-06: validateJwtSecret refuses the known sample values, even with 32+ characters", () => {
  // The old .env.example had 38 characters: the length rule alone would not reject it.
  const examples = [
    "supersecretkeychangeinproduction",
    "seu-segredo-jwt-aqui-mude-em-producao",
    "SEU-SEGREDO-JWT-AQUI-MUDE-EM-PRODUCAO",
    "please-changeme-please-changeme-please",
  ];
  for (const example of examples) {
    assert.ok(example.length >= 32, `precondition: "${example}" has 32+ characters`);
    assert.notEqual(validateJwtSecret(example), null, example);
  }
});

test("REQ-OPS-06: the error message never contains the secret value", () => {
  const secret = "supersecretkeychangeinproduction";
  const error = validateJwtSecret(secret);
  assert.ok(error);
  assert.ok(!error.includes(secret));
});

/**
 * Runs `register()` observing whether the process would exit. `process.exit` is
 * replaced by a function that throws (a real exit would kill the test) and
 * `console.error` is captured.
 */
async function runRegister(): Promise<{ exitCode?: number; message: string }> {
  const leave = mock.method(process, "exit", (code?: number) => {
    throw new Error(`exit:${code}`);
  });
  const error = mock.method(console, "error", () => {});
  try {
    await register();
    return { message: "" };
  } catch (e) {
    const matched = /^exit:(\d+)$/.exec((e as Error).message);
    if (!matched) throw e;
    return {
      exitCode: Number(matched[1]),
      message: error.mock.calls.map((c) => String(c.arguments[0])).join("\n"),
    };
  } finally {
    leave.mock.restore();
    error.mock.restore();
  }
}

test("REQ-OPS-06: in production, register() ends the process (code 1) with an invalid secret", async () => {
  for (const jwt of [undefined, "", "short", "supersecretkeychangeinproduction"]) {
    await withEnvironment({ ...PRODUCTION, JWT_SECRET: jwt }, async () => {
      const r = await runRegister();
      assert.equal(r.exitCode, 1, `JWT_SECRET=${jwt === undefined ? "(missing)" : "invalid"}`);
      assert.match(r.message, /JWT_SECRET/);
      // only long values: "short" is a word the message itself uses
      if (jwt && jwt.length >= 20) {
        assert.ok(!r.message.includes(jwt), "the message must not reveal the secret");
      }
    });
  }
});

test("REQ-OPS-18: in production, register() ends the process if DATABASE_URL is missing or not PostgreSQL, and the message does not leak the URL", async () => {
  for (const url of [undefined, "", "mysql://u:p@h/db", "not-a-url"]) {
    await withEnvironment({ ...PRODUCTION, JWT_SECRET: VALID_SECRET, DATABASE_URL: url }, async () => {
      const r = await runRegister();
      assert.equal(r.exitCode, 1, `DATABASE_URL=${url === undefined ? "(missing)" : url}`);
      assert.match(r.message, /DATABASE_URL/);
      assert.ok(!r.message.includes("not-a-url") || url === "not-a-url");
    });
  }
});

test("REQ-OPS-18: all problems show up at once (secret and database), and Redis is optional", async () => {
  await withEnvironment({ ...PRODUCTION, JWT_SECRET: "short", DATABASE_URL: undefined, REDIS_URL: undefined }, async () => {
    const r = await runRegister();
    assert.equal(r.exitCode, 1);
    assert.match(r.message, /JWT_SECRET/);
    assert.match(r.message, /DATABASE_URL/);
    assert.doesNotMatch(r.message, /REDIS_URL/);
  });
  await withEnvironment({ ...PRODUCTION, JWT_SECRET: VALID_SECRET, REDIS_URL: undefined }, async () => {
    assert.equal((await runRegister()).exitCode, undefined);
  });
});

test("REQ-OPS-06: in production, register() starts with a valid secret", async () => {
  await withEnvironment({ ...PRODUCTION, JWT_SECRET: VALID_SECRET }, async () => {
    assert.equal((await runRegister()).exitCode, undefined);
  });
});

test("REQ-OPS-06: outside production, register() does not require the secret", async () => {
  for (const nodeEnv of ["development", "test"]) {
    await withEnvironment({ ...PRODUCTION, NODE_ENV: nodeEnv, JWT_SECRET: undefined }, async () => {
      assert.equal((await runRegister()).exitCode, undefined);
    });
  }
});

test("REQ-OPS-06: during the build and in the edge runtime, register() does not validate (the Docker build has no secret)", async () => {
  await withEnvironment(
    { ...PRODUCTION, NEXT_PHASE: "phase-production-build", JWT_SECRET: undefined },
    async () => {
      assert.equal((await runRegister()).exitCode, undefined);
    },
  );
  await withEnvironment({ ...PRODUCTION, NEXT_RUNTIME: "edge", JWT_SECRET: undefined }, async () => {
    assert.equal((await runRegister()).exitCode, undefined);
  });
});

// ---------------------------------------------------------------------------
// REQ-OPS-09: seeds without an embedded password
// ---------------------------------------------------------------------------

/**
 * Runs a seed as a child process. The password variables are always defined
 * (even if empty): the seeds' dotenv loads `.env.local` without overriding what
 * already exists in the environment, and the test cannot depend on the runner's file.
 */
function runSeed(file: string, environment: Environment) {
  return spawnSync("npx", ["tsx", file], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SEED_USER_PASSWORD: "",
      ADMIN_PASSWORD: "",
      ...environment,
    } as NodeJS.ProcessEnv,
    encoding: "utf8",
    shell: true,
  });
}

test("REQ-OPS-09: seed.ts without SEED_USER_PASSWORD or with a short password fails without writing anything", async () => {
  const before = await prisma.user.count();
  for (const password of ["", "short-11chr"]) {
    const r = runSeed("prisma/seed.ts", { SEED_USER_PASSWORD: password });
    assert.notEqual(r.status, 0, `password "${password}" should have failed`);
    assert.match(r.stderr, /SEED_USER_PASSWORD/);
  }
  assert.equal(await prisma.user.count(), before);
});

test("REQ-OPS-09: seed-admin.ts without ADMIN_PASSWORD or with a short password fails without writing anything", async () => {
  const mail = email("seedadmin-fail");
  const before = await prisma.user.count();
  for (const password of ["", "short-11chr"]) {
    const r = runSeed("prisma/seed-admin.ts", {
      ADMIN_EMAIL: mail,
      ADMIN_PASSWORD: password,
    });
    assert.notEqual(r.status, 0, `password "${password}" should have failed`);
    assert.match(r.stderr, /ADMIN_PASSWORD/);
  }
  assert.equal(await prisma.user.count(), before);
  assert.equal(await prisma.user.findUnique({ where: { email: mail } }), null);
});

test("REQ-OPS-09: seed-admin.ts with a valid ADMIN_PASSWORD creates the ADMIN with a usable password", async () => {
  const mail = email("seedadmin-ok");
  const password = "StrongPassword-Test-1";
  try {
    const r = runSeed("prisma/seed-admin.ts", {
      ADMIN_EMAIL: mail,
      ADMIN_PASSWORD: password,
    });
    assert.equal(r.status, 0, r.stderr);
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: mail } });
    assert.equal(admin.type, "ADMIN");
    assert.equal(await bcrypt.compare(password, admin.password), true);
  } finally {
    await prisma.user.deleteMany({ where: { email: mail } });
  }
});

test("REQ-OPS-09: no seed file contains a hard-coded password", () => {
  for (const file of ["prisma/seed.ts", "prisma/seed-admin.ts"]) {
    const text = readFileSync(file, "utf8");
    assert.ok(!text.includes("EcoshopDemo@2026"), `${file} hard-codes the demo password`);
    assert.ok(!text.includes("Admin@123456"), `${file} hard-codes the admin password`);
  }
});

test("REQ-OPS-09: the seed-admin does not print the administrator password to the log", () => {
  const text = readFileSync("prisma/seed-admin.ts", "utf8");
  // the line that shows the MASKED password (`"•".repeat(...)`) is allowed
  assert.doesNotMatch(text, /Password: \$\{(?!"•")/);
  assert.doesNotMatch(text, /console\.(log|error)\(\s*`[^`]*ADMIN_CONFIG\.password(?!\.length)/);
});
