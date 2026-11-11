/**
 * Operação segura (spec 008): configuração de entrega versionada no repositório.
 *
 * Testes estáticos: leem compose, Dockerfile, workflow e script de deploy. O que
 * exige Docker ou um servidor (subir de fato, reverter de fato) roda no CI ou é
 * registrado como verificação manual em `docs/capabilities/operacao/status.md`.
 */
import { encerrar } from "./helpers";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import nextConfig from "@/next.config";

after(encerrar);

/** Texto do arquivo sem as linhas de comentário (um comentário pode citar `:-` ou portas de propósito). */
function semComentarios(arquivo: string): string {
  return readFileSync(arquivo, "utf8")
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("#"))
    .join("\n");
}

const COMPOSE_BASE = semComentarios("docker-compose.yml");
const COMPOSE_DEV = semComentarios("docker-compose.override.yml");
const COMPOSE_PROD = semComentarios("docker-compose.prod.yml");
const CI = semComentarios(".github/workflows/ci.yml");
const DEPLOY = semComentarios("scripts/deploy/deploy.sh");

// ---------------------------------------------------------------------------
// REQ-OPS-07, 08, 11: compose
// ---------------------------------------------------------------------------

test("REQ-OPS-07: nenhum compose tem valor padrão (`:-`) para segredo nem senha fixa", () => {
  const segredoComPadrao = /\$\{[A-Z_]*(SECRET|PASSWORD|KEY)[A-Z_]*:-/;
  for (const [nome, texto] of [
    ["docker-compose.yml", COMPOSE_BASE],
    ["docker-compose.override.yml", COMPOSE_DEV],
    ["docker-compose.prod.yml", COMPOSE_PROD],
  ]) {
    assert.doesNotMatch(texto, segredoComPadrao, `${nome} tem segredo com valor padrão`);
    assert.doesNotMatch(texto, /supersecretkey/i, nome);
    assert.doesNotMatch(texto, /POSTGRES_PASSWORD:\s*ecoshop/, nome);
    assert.doesNotMatch(texto, /ecoshop:ecoshop@/, nome);
  }
});

test("REQ-OPS-07: a falta de um segredo obrigatório impede a subida e nomeia a variável", () => {
  const obrigatorias = ["JWT_SECRET", "POSTGRES_PASSWORD", "REDIS_PASSWORD", "ADMIN_PASSWORD"];
  for (const variavel of obrigatorias) {
    const exige = new RegExp(`\\$\\{${variavel}:\\?[^}]+\\}`);
    assert.match(COMPOSE_BASE, exige, `docker-compose.yml: ${variavel}`);
    assert.match(COMPOSE_PROD, exige, `docker-compose.prod.yml: ${variavel}`);
  }
  assert.match(COMPOSE_DEV, /\$\{SEED_USER_PASSWORD:\?[^}]+\}/);
});

test("REQ-OPS-08: o compose base e o de publicação não publicam as portas do Postgres nem do Redis", () => {
  for (const texto of [COMPOSE_BASE, COMPOSE_PROD]) {
    assert.doesNotMatch(texto, /(5432|6379):(5432|6379)/);
  }
});

test("REQ-OPS-08: publicar as portas do banco e do Redis é opt-in de desenvolvimento, só em 127.0.0.1", () => {
  assert.match(COMPOSE_DEV, /"127\.0\.0\.1:5432:5432"/);
  assert.match(COMPOSE_DEV, /"127\.0\.0\.1:6379:6379"/);
});

test("REQ-OPS-11: o compose de publicação usa imagem do GHCR (sem build) e não roda o seed de demonstração", () => {
  assert.doesNotMatch(COMPOSE_PROD, /^\s*build:/m);
  assert.match(COMPOSE_PROD, /image:\s*\$\{ECOSHOP_IMAGE:\?[^}]+\}:\$\{APP_TAG:\?[^}]+\}\s*$/m);
  assert.match(COMPOSE_PROD, /\$\{ECOSHOP_IMAGE:\?[^}]+\}:\$\{APP_TAG:\?[^}]+\}-migrator/);
  assert.doesNotMatch(COMPOSE_PROD, /prisma\/seed\.ts/);
});

test("REQ-OPS-11: no compose de publicação a app só escuta em 127.0.0.1 e o seed-admin só roda sob demanda", () => {
  assert.match(COMPOSE_PROD, /"127\.0\.0\.1:3000:3000"/);
  assert.match(COMPOSE_PROD, /seed-admin:[\s\S]*?profiles:\s*\["bootstrap"\]/);
});

test("REQ-OPS-11: o CI publica a imagem de migração e o deploy usa os arquivos versionados", () => {
  assert.match(CI, /target:\s*migrator/);
  assert.match(CI, /docker-compose\.prod\.yml/);
  assert.match(CI, /scripts\/deploy\/deploy\.sh/);
});

// ---------------------------------------------------------------------------
// REQ-OPS-10: deploy
// ---------------------------------------------------------------------------

test("REQ-OPS-10: o script de deploy aborta em qualquer falha e exige a tag", () => {
  assert.match(readFileSync("scripts/deploy/deploy.sh", "utf8"), /^#!\/bin\/sh/);
  assert.match(DEPLOY, /^set -eu$/m);
  assert.match(DEPLOY, /APP_TAG:\?/);
});

test("REQ-OPS-10: o script aplica as migrations antes de subir a app, verifica a saúde e só então reverte", () => {
  const migrar = DEPLOY.indexOf("run --rm migrate");
  const subir = DEPLOY.indexOf("up -d --no-deps app");
  const saude = DEPLOY.indexOf("curl ");
  const reverter = DEPLOY.lastIndexOf("up -d --no-deps app");
  assert.match(DEPLOY, /URL_SAUDE=http:\/\/127\.0\.0\.1:3000\/api\/health/);
  assert.ok(migrar >= 0 && subir >= 0 && saude >= 0, "faltam etapas no script");
  assert.ok(migrar < subir, "as migrations precisam rodar antes de subir a app");
  assert.ok(subir < saude, "a saúde é verificada depois de subir a app");
  assert.ok(reverter > saude, "a reversão vem depois da verificação de saúde");
  assert.match(DEPLOY, /APP_TAG="\$TAG_ANTERIOR"/);
  assert.match(DEPLOY, /exit 1/);
});

test("REQ-OPS-10: o job de deploy usa ssh/scp nativos com host verificado, sem action de terceiros", () => {
  assert.doesNotMatch(CI, /appleboy/);
  assert.match(CI, /SSH_KNOWN_HOSTS/);
  assert.match(CI, /\bscp\b/);
  assert.match(CI, /StrictHostKeyChecking=yes/);
});

// ---------------------------------------------------------------------------
// REQ-OPS-12: cabeçalhos de segurança
// ---------------------------------------------------------------------------

/** Executa `fn` com `NODE_ENV` alterado e restaura no final. */
async function comNodeEnv(valor: string, fn: () => Promise<void>) {
  const env = process.env as Record<string, string | undefined>;
  const anterior = env.NODE_ENV;
  env.NODE_ENV = valor;
  try {
    await fn();
  } finally {
    if (anterior === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = anterior;
  }
}

async function cabecalhosDeTodasAsRotas(): Promise<Record<string, string>> {
  assert.ok(nextConfig.headers, "next.config.ts não define headers()");
  const regras = await nextConfig.headers();
  const regra = regras.find((r) => r.source === "/:path*");
  assert.ok(regra, "falta uma regra de cabeçalhos para /:path*");
  return Object.fromEntries(regra.headers.map((h) => [h.key, h.value]));
}

test("REQ-OPS-12: toda rota recebe nosniff, X-Frame-Options, Referrer-Policy e Permissions-Policy", async () => {
  const h = await cabecalhosDeTodasAsRotas();
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.equal(h["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(h["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
});

test("REQ-OPS-12: Strict-Transport-Security só em produção, curto e sem includeSubDomains/preload", async () => {
  await comNodeEnv("development", async () => {
    assert.equal((await cabecalhosDeTodasAsRotas())["Strict-Transport-Security"], undefined);
  });
  await comNodeEnv("production", async () => {
    assert.equal((await cabecalhosDeTodasAsRotas())["Strict-Transport-Security"], "max-age=300");
  });
});

// ---------------------------------------------------------------------------
// REQ-OPS-13: digests e Dependabot
// ---------------------------------------------------------------------------

test("REQ-OPS-13: toda imagem base (Dockerfile e compose) é fixada por digest", () => {
  const froms = semComentarios("Dockerfile").match(/^FROM\s+\S+/gm) ?? [];
  assert.ok(froms.length >= 4, "esperava os 4 estágios do Dockerfile");
  for (const from of froms) assert.match(from, /@sha256:[0-9a-f]{64}/, from);

  for (const texto of [COMPOSE_BASE, COMPOSE_PROD]) {
    // A imagem da própria aplicação (variável) é identificada por tag de commit, não por digest.
    const imagens = (texto.match(/^\s*image:\s*\S+/gm) ?? []).filter((l) => !l.includes("${"));
    assert.ok(imagens.length >= 2, "esperava postgres e redis");
    for (const imagem of imagens) assert.match(imagem, /@sha256:[0-9a-f]{64}/, imagem);
  }
});

test("REQ-OPS-13: o Dependabot atualiza imagens Docker, compose e actions", () => {
  const dependabot = readFileSync(".github/dependabot.yml", "utf8");
  for (const ecossistema of ["docker", "docker-compose", "github-actions"]) {
    assert.match(dependabot, new RegExp(`package-ecosystem:\\s*"?${ecossistema}"?`), ecossistema);
  }
});
