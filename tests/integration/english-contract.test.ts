/**
 * English wire and data contract (spec 016, ADR-0023).
 *
 * Static tests: they read the schema, the migrations and the source tree. They need neither a
 * database nor Redis. That the migration builds an empty database that matches the schema
 * is recorded as manual verification in `docs/capabilities/operations/status.md`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Portuguese names the contract used before ADR-0023. None of them may come back. */
const FORBIDDEN = [
  "usuario", "usuarios", "produto", "produtos", "marca", "marcas", "categoria", "categorias",
  "certificado", "certificados", "nome", "descricao", "preco", "senha", "telefone", "tipo",
  "criadoEm", "fotoUrl", "orgaoEmissor", "erro", "mensagem", "historico", "painel", "perfil",
  "educacao", "aprovar", "sucesso", "sugestao", "carregando", "arquivo", "relevancia",
  "degradado", "indisponivel", "relatorio", "titulo", "detalhes", "foto", "fotos",
  "CLIENTE", "PENDENTE", "APROVADA", "REJEITADA", "TipoUsuario", "StatusMarca",
  "impacto_ambiental", "tempo_decomposicao", "onde_descartar", "reciclabilidade",
  "dicas_sustentaveis", "beneficios_reciclagem", "analise_sustentabilidade", "material_provavel",
];
const FORBIDDEN_RE = new RegExp(`\\b(${FORBIDDEN.join("|")})\\b`);

const SOURCE_DIRS = ["app", "lib", "services", "types", "config", "prisma", "scripts/ops", "tests"];
const SOURCE_FILES = ["middleware.ts", "next.config.ts", "eslint.config.mjs"];
const SOURCE_EXT = /\.(ts|tsx|mjs|prisma|sql)$/;

/** This file lists the old names on purpose. */
const SELF = "tests/integration/english-contract.test.ts";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function sourceFiles(): string[] {
  const files = SOURCE_DIRS.filter((d) => existsSync(d)).flatMap(walk);
  files.push(...SOURCE_FILES.filter((f) => existsSync(f)));
  return files
    .map((f) => f.split(path.sep).join("/"))
    .filter((f) => SOURCE_EXT.test(f) && f !== SELF);
}

test("REQ-OPS-21: the migrations are a single English `init` generated from the schema", () => {
  const folders = readdirSync("prisma/migrations").filter((n) =>
    statSync(path.join("prisma/migrations", n)).isDirectory(),
  );
  assert.equal(folders.length, 1, `expected one migration, found: ${folders.join(", ")}`);
  assert.match(folders[0], /^\d{14}_init$/);

  const sql = readFileSync(path.join("prisma/migrations", folders[0], "migration.sql"), "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  for (const [label, text] of [["migration.sql", sql], ["schema.prisma", schema]] as const) {
    const hit = FORBIDDEN_RE.exec(text);
    assert.equal(hit, null, `${label} still has the Portuguese name "${hit?.[0]}"`);
  }

  for (const table of ["users", "categories", "brands", "certificates", "products", "product_certificates"]) {
    assert.match(sql, new RegExp(`CREATE TABLE "${table}"`), `table ${table}`);
  }
  assert.match(sql, /CREATE TYPE "UserType" AS ENUM \('ADMIN', 'CUSTOMER', 'BRAND'\)/);
  assert.match(sql, /CREATE TYPE "BrandStatus" AS ENUM \('PENDING', 'APPROVED', 'REJECTED'\)/);
});

test("REQ-OPS-21: there is a single copy of the schema", () => {
  assert.ok(!existsSync("prisma/schema.txt"), "prisma/schema.txt is a stale second copy of the schema");
});

test("REQ-OPS-22: no Portuguese contract name is left in the code, tests, seeds or scripts", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles()) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      const hit = FORBIDDEN_RE.exec(line);
      if (hit) offenders.push(`${file}:${i + 1}: ${hit[0]}`);
    });
  }
  assert.deepEqual(offenders, [], `Portuguese names found:\n${offenders.slice(0, 20).join("\n")}`);
});

test("REQ-OPS-22: the old Portuguese API paths and page folders no longer exist", () => {
  const gone = [
    "app/api/produtos", "app/api/marcas", "app/api/categorias", "app/api/certificados",
    "app/api/usuarios", "app/api/ia",
    "app/(admin)/painel", "app/(perfil)", "app/(educacao)", "app/(ia-scan)", "app/(sobre)",
    "app/(store)/produtos",
  ];
  for (const p of gone) assert.ok(!existsSync(p), `${p} should not exist`);
  for (const p of ["app/api/products", "app/api/brands", "app/api/users", "app/api/ai", "app/(admin)/dashboard"]) {
    assert.ok(existsSync(p), `${p} should exist`);
  }
});
