/**
 * Operação segura (spec 008): configuração de entrega versionada no repositório.
 *
 * Testes estáticos: leem compose, Dockerfile, workflow e script de deploy. O que
 * exige Docker ou um servidor (subir de fato, reverter de fato) roda no CI ou é
 * registrado como verificação manual em `docs/capabilities/operacao/status.md`.
 */
import { closeConnections } from "./helpers";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import nextConfig from "@/next.config";

after(closeConnections);

/** Texto do arquivo sem as linhas de comentário (um comentário pode citar `:-` ou portas de propósito). */
function withoutComments(file: string): string {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
}

const COMPOSE_BASE = withoutComments("docker-compose.yml");
const COMPOSE_DEV = withoutComments("docker-compose.override.yml");
const COMPOSE_PROD = withoutComments("docker-compose.prod.yml");
const CI = withoutComments(".github/workflows/ci.yml");
const DEPLOY = withoutComments("scripts/deploy/deploy.sh");

// ---------------------------------------------------------------------------
// REQ-OPS-07, 08, 11: compose
// ---------------------------------------------------------------------------

test("REQ-OPS-07: no compose has a default value (`:-`) for a secret or a fixed password", () => {
  const secretWithDefault = /\$\{[A-Z_]*(SECRET|PASSWORD|KEY)[A-Z_]*:-/;
  for (const [name, text] of [
    ["docker-compose.yml", COMPOSE_BASE],
    ["docker-compose.override.yml", COMPOSE_DEV],
    ["docker-compose.prod.yml", COMPOSE_PROD],
  ]) {
    assert.doesNotMatch(text, secretWithDefault, `${name} has a secret with a default value`);
    assert.doesNotMatch(text, /supersecretkey/i, name);
    assert.doesNotMatch(text, /POSTGRES_PASSWORD:\s*ecoshop/, name);
    assert.doesNotMatch(text, /ecoshop:ecoshop@/, name);
  }
});

test("REQ-OPS-07: a missing required secret blocks startup and names the variable", () => {
  const required = ["JWT_SECRET", "POSTGRES_PASSWORD", "REDIS_PASSWORD", "ADMIN_PASSWORD"];
  for (const variable of required) {
    const requires = new RegExp(`\\$\\{${variable}:\\?[^}]+\\}`);
    assert.match(COMPOSE_BASE, requires, `docker-compose.yml: ${variable}`);
    assert.match(COMPOSE_PROD, requires, `docker-compose.prod.yml: ${variable}`);
  }
  assert.match(COMPOSE_DEV, /\$\{SEED_USER_PASSWORD:\?[^}]+\}/);
});

test("REQ-OPS-08: the base and publishing composes do not publish the Postgres or Redis ports", () => {
  for (const text of [COMPOSE_BASE, COMPOSE_PROD]) {
    assert.doesNotMatch(text, /(5432|6379):(5432|6379)/);
  }
});

test("REQ-OPS-08: publishing the database and Redis ports is a development opt-in, only on 127.0.0.1", () => {
  assert.match(COMPOSE_DEV, /"127\.0\.0\.1:5432:5432"/);
  assert.match(COMPOSE_DEV, /"127\.0\.0\.1:6379:6379"/);
});

test("REQ-OPS-11: the publishing compose uses a GHCR image (no build) and does not run the demo seed", () => {
  assert.doesNotMatch(COMPOSE_PROD, /^\s*build:/m);
  assert.match(COMPOSE_PROD, /image:\s*\$\{ECOSHOP_IMAGE:\?[^}]+\}:\$\{APP_TAG:\?[^}]+\}\s*$/m);
  assert.match(COMPOSE_PROD, /\$\{ECOSHOP_IMAGE:\?[^}]+\}:\$\{APP_TAG:\?[^}]+\}-migrator/);
  assert.doesNotMatch(COMPOSE_PROD, /prisma\/seed\.ts/);
});

test("REQ-OPS-11: in the publishing compose the app only listens on 127.0.0.1 and the seed-admin only runs on demand", () => {
  assert.match(COMPOSE_PROD, /"127\.0\.0\.1:3000:3000"/);
  assert.match(COMPOSE_PROD, /seed-admin:[\s\S]*?profiles:\s*\["bootstrap"\]/);
});

test("REQ-OPS-11: CI publishes the migration image and the deploy uses the versioned files", () => {
  assert.match(CI, /target:\s*migrator/);
  assert.match(CI, /docker-compose\.prod\.yml/);
  assert.match(CI, /scripts\/deploy\/deploy\.sh/);
});

// ---------------------------------------------------------------------------
// REQ-OPS-10: deploy
// ---------------------------------------------------------------------------

test("REQ-OPS-10: the deploy script aborts on any failure and requires the tag", () => {
  assert.match(readFileSync("scripts/deploy/deploy.sh", "utf8"), /^#!\/bin\/sh/);
  assert.match(DEPLOY, /^set -eu$/m);
  assert.match(DEPLOY, /APP_TAG:\?/);
});

test("REQ-OPS-10: the script applies migrations before starting the app, checks health and only then rolls back", () => {
  const migrate = DEPLOY.indexOf("run --rm migrate");
  const start = DEPLOY.indexOf("up -d --no-deps app");
  const health = DEPLOY.indexOf("curl ");
  const revert = DEPLOY.lastIndexOf("up -d --no-deps app");
  assert.match(DEPLOY, /URL_SAUDE=http:\/\/127\.0\.0\.1:3000\/api\/health/);
  assert.ok(migrate >= 0 && start >= 0 && health >= 0, "script steps are missing");
  assert.ok(migrate < start, "migrations must run before starting the app");
  assert.ok(start < health, "health is checked after starting the app");
  assert.ok(revert > health, "the rollback comes after the health check");
  assert.match(DEPLOY, /APP_TAG="\$TAG_ANTERIOR"/);
  assert.match(DEPLOY, /exit 1/);
});

test("REQ-OPS-10: the deploy job uses native ssh/scp with a verified host, no third-party action", () => {
  assert.doesNotMatch(CI, /appleboy/);
  assert.match(CI, /SSH_KNOWN_HOSTS/);
  assert.match(CI, /\bscp\b/);
  assert.match(CI, /StrictHostKeyChecking=yes/);
});

// ---------------------------------------------------------------------------
// REQ-OPS-12: cabeçalhos de segurança
// ---------------------------------------------------------------------------

/** Executa `fn` com `NODE_ENV` alterado e restaura no final. */
async function comNodeEnv(value: string, fn: () => Promise<void>) {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.NODE_ENV;
  env.NODE_ENV = value;
  try {
    await fn();
  } finally {
    if (previous === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previous;
  }
}

async function headersForAllRoutes(): Promise<Record<string, string>> {
  assert.ok(nextConfig.headers, "next.config.ts does not define headers()");
  const rules = await nextConfig.headers();
  const rule = rules.find((r) => r.source === "/:path*");
  assert.ok(rule, "missing a headers rule for /:path*");
  return Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
}

test("REQ-OPS-12: toda rota recebe nosniff, X-Frame-Options, Referrer-Policy e Permissions-Policy", async () => {
  const h = await headersForAllRoutes();
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.equal(h["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(h["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
});

test("REQ-OPS-12: Strict-Transport-Security only in production, short and without includeSubDomains/preload", async () => {
  await comNodeEnv("development", async () => {
    assert.equal((await headersForAllRoutes())["Strict-Transport-Security"], undefined);
  });
  await comNodeEnv("production", async () => {
    assert.equal((await headersForAllRoutes())["Strict-Transport-Security"], "max-age=300");
  });
});

// ---------------------------------------------------------------------------
// REQ-OPS-13: digests e Dependabot
// ---------------------------------------------------------------------------

test("REQ-OPS-13: every base image (Dockerfile and compose) is pinned by digest", () => {
  const froms = withoutComments("Dockerfile").match(/^FROM\s+\S+/gm) ?? [];
  assert.ok(froms.length >= 4, "expected the 4 Dockerfile stages");
  for (const from of froms) assert.match(from, /@sha256:[0-9a-f]{64}/, from);

  for (const text of [COMPOSE_BASE, COMPOSE_PROD]) {
    // A imagem da própria aplicação (variável) é identificada por tag de commit, não por digest.
    const images = (text.match(/^\s*image:\s*\S+/gm) ?? []).filter((l) => !l.includes("${"));
    assert.ok(images.length >= 2, "esperava postgres e redis");
    for (const image of images) assert.match(image, /@sha256:[0-9a-f]{64}/, image);
  }
});

test("REQ-OPS-13: o Dependabot atualiza imagens Docker, compose e actions", () => {
  const dependabot = readFileSync(".github/dependabot.yml", "utf8");
  for (const ecosystem of ["docker", "docker-compose", "github-actions"]) {
    assert.match(dependabot, new RegExp(`package-ecosystem:\\s*"?${ecosystem}"?`), ecosystem);
  }
});
