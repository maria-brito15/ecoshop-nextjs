/**
 * Operação segura (spec 008): comportamento de inicialização e do que o repositório
 * entrega para rodar e publicar o sistema.
 *
 * Não precisa de banco nem de Redis: valida funções puras e lê arquivos versionados
 * (compose, workflow, scripts). O que exige Docker ou build roda no CI (ver ci.yml).
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

const SEGREDO_VALIDO ="x7Qm2LbR9vTn4KcE8wYpZa3JdHfUg6Nz";

type Ambiente = Record<string, string | undefined>;

/** Executa `fn` com variáveis de ambiente alteradas e restaura tudo no final. */
async function comAmbiente(alteracoes: Ambiente, fn: () => Promise<void>) {
  const env = process.env as Ambiente;
  const anteriores: Ambiente = {};
  for (const key of Object.keys(alteracoes)) {
    anteriores[key] = env[key];
    if (alteracoes[key] === undefined) delete env[key];
    else env[key] = alteracoes[key];
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(anteriores)) {
      if (anteriores[key] === undefined) delete env[key];
      else env[key] = anteriores[key];
    }
  }
}

const PRODUCAO: Ambiente = {
  NODE_ENV: "production",
  NEXT_RUNTIME: "nodejs",
  DATABASE_URL: "postgresql://usuario:senha@host:5432/banco",
  NEXT_PHASE: undefined,
};

test("REQ-OPS-06: validarJwtSecret aceita um segredo com 32+ caracteres que não é valor-exemplo", () => {
  assert.equal(validateJwtSecret(SEGREDO_VALIDO), null);
});

test("REQ-OPS-06: validarJwtSecret recusa segredo ausente, vazio ou curto", () => {
  assert.notEqual(validateJwtSecret(undefined), null);
  assert.notEqual(validateJwtSecret(""), null);
  assert.notEqual(validateJwtSecret("a".repeat(31)), null);
  assert.equal(validateJwtSecret("a1B2".repeat(8)), null);
});

test("REQ-OPS-06: validarJwtSecret recusa os valores-exemplo conhecidos, mesmo com 32+ caracteres", () => {
  // O .env.example antigo tinha 38 caracteres: só a regra de tamanho não o barraria.
  const exemplos = [
    "supersecretkeychangeinproduction",
    "seu-segredo-jwt-aqui-mude-em-producao",
    "SEU-SEGREDO-JWT-AQUI-MUDE-EM-PRODUCAO",
    "please-changeme-please-changeme-please",
  ];
  for (const exemplo of exemplos) {
    assert.ok(exemplo.length >= 32, `precondição: "${exemplo}" tem 32+ caracteres`);
    assert.notEqual(validateJwtSecret(exemplo), null, exemplo);
  }
});

test("REQ-OPS-06: a mensagem de erro nunca contém o valor do segredo", () => {
  const segredo = "supersecretkeychangeinproduction";
  const erro = validateJwtSecret(segredo);
  assert.ok(erro);
  assert.ok(!erro.includes(segredo));
});

/**
 * Executa `register()` observando se o processo seria encerrado. `process.exit` é
 * trocado por uma função que lança (um exit de verdade mataria o teste) e
 * `console.error` é capturado.
 */
async function executarRegister(): Promise<{ codigoDeSaida?: number; mensagem: string }> {
  const sair = mock.method(process, "exit", (codigo?: number) => {
    throw new Error(`exit:${codigo}`);
  });
  const erro = mock.method(console, "error", () => {});
  try {
    await register();
    return { mensagem: "" };
  } catch (e) {
    const casou = /^exit:(\d+)$/.exec((e as Error).message);
    if (!casou) throw e;
    return {
      codigoDeSaida: Number(casou[1]),
      mensagem: erro.mock.calls.map((c) => String(c.arguments[0])).join("\n"),
    };
  } finally {
    sair.mock.restore();
    erro.mock.restore();
  }
}

test("REQ-OPS-06: em produção, register() encerra o processo (código 1) com segredo inválido", async () => {
  for (const jwt of [undefined, "", "curto", "supersecretkeychangeinproduction"]) {
    await comAmbiente({ ...PRODUCAO, JWT_SECRET: jwt }, async () => {
      const r = await executarRegister();
      assert.equal(r.codigoDeSaida, 1, `JWT_SECRET=${jwt === undefined ? "(ausente)" : "inválido"}`);
      assert.match(r.mensagem, /JWT_SECRET/);
      // só valores longos: "curto" é uma palavra que a própria mensagem usa
      if (jwt && jwt.length >= 20) {
        assert.ok(!r.mensagem.includes(jwt), "a mensagem não pode revelar o segredo");
      }
    });
  }
});

test("REQ-OPS-18: em produção, register() encerra o processo se DATABASE_URL falta ou não é PostgreSQL, e a mensagem não vaza a URL", async () => {
  for (const url of [undefined, "", "mysql://u:p@h/db", "nao-e-url"]) {
    await comAmbiente({ ...PRODUCAO, JWT_SECRET: SEGREDO_VALIDO, DATABASE_URL: url }, async () => {
      const r = await executarRegister();
      assert.equal(r.codigoDeSaida, 1, `DATABASE_URL=${url === undefined ? "(ausente)" : url}`);
      assert.match(r.mensagem, /DATABASE_URL/);
      assert.ok(!r.mensagem.includes("nao-e-url") || url === "nao-e-url");
    });
  }
});

test("REQ-OPS-18: todos os problemas aparecem de uma vez (segredo e banco), e o Redis é opcional", async () => {
  await comAmbiente({ ...PRODUCAO, JWT_SECRET: "curto", DATABASE_URL: undefined, REDIS_URL: undefined }, async () => {
    const r = await executarRegister();
    assert.equal(r.codigoDeSaida, 1);
    assert.match(r.mensagem, /JWT_SECRET/);
    assert.match(r.mensagem, /DATABASE_URL/);
    assert.doesNotMatch(r.mensagem, /REDIS_URL/);
  });
  await comAmbiente({ ...PRODUCAO, JWT_SECRET: SEGREDO_VALIDO, REDIS_URL: undefined }, async () => {
    assert.equal((await executarRegister()).codigoDeSaida, undefined);
  });
});

test("REQ-OPS-06: em produção, register() inicia com segredo válido", async () => {
  await comAmbiente({ ...PRODUCAO, JWT_SECRET: SEGREDO_VALIDO }, async () => {
    assert.equal((await executarRegister()).codigoDeSaida, undefined);
  });
});

test("REQ-OPS-06: fora de produção, register() não exige o segredo", async () => {
  for (const nodeEnv of ["development", "test"]) {
    await comAmbiente({ ...PRODUCAO, NODE_ENV: nodeEnv, JWT_SECRET: undefined }, async () => {
      assert.equal((await executarRegister()).codigoDeSaida, undefined);
    });
  }
});

test("REQ-OPS-06: durante o build e no runtime edge, register() não valida (build do Docker não tem o segredo)", async () => {
  await comAmbiente(
    { ...PRODUCAO, NEXT_PHASE: "phase-production-build", JWT_SECRET: undefined },
    async () => {
      assert.equal((await executarRegister()).codigoDeSaida, undefined);
    },
  );
  await comAmbiente({ ...PRODUCAO, NEXT_RUNTIME: "edge", JWT_SECRET: undefined }, async () => {
    assert.equal((await executarRegister()).codigoDeSaida, undefined);
  });
});

// ---------------------------------------------------------------------------
// REQ-OPS-09: seeds sem senha embutida
// ---------------------------------------------------------------------------

/**
 * Roda um seed como processo filho. As variáveis de senha são sempre definidas
 * (mesmo vazias): o dotenv dos seeds carrega `.env.local` sem sobrescrever o que
 * já existe no ambiente, e o teste não pode depender do arquivo de quem o roda.
 */
function rodarSeed(file: string, ambiente: Ambiente) {
  return spawnSync("npx", ["tsx", file], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SEED_USER_PASSWORD: "",
      ADMIN_PASSWORD: "",
      ...ambiente,
    } as NodeJS.ProcessEnv,
    encoding: "utf8",
    shell: true,
  });
}

test("REQ-OPS-09: seed.ts sem SEED_USER_PASSWORD ou com senha curta falha sem gravar nada", async () => {
  const antes = await prisma.usuario.count();
  for (const password of ["", "curta-11chr"]) {
    const r = rodarSeed("prisma/seed.ts", { SEED_USER_PASSWORD: password });
    assert.notEqual(r.status, 0, `senha "${password}" deveria falhar`);
    assert.match(r.stderr, /SEED_USER_PASSWORD/);
  }
  assert.equal(await prisma.usuario.count(), antes);
});

test("REQ-OPS-09: seed-admin.ts sem ADMIN_PASSWORD ou com senha curta falha sem gravar nada", async () => {
  const mail = email("seedadmin-falha");
  const antes = await prisma.usuario.count();
  for (const password of ["", "curta-11chr"]) {
    const r = rodarSeed("prisma/seed-admin.ts", {
      ADMIN_EMAIL: mail,
      ADMIN_PASSWORD: password,
    });
    assert.notEqual(r.status, 0, `senha "${password}" deveria falhar`);
    assert.match(r.stderr, /ADMIN_PASSWORD/);
  }
  assert.equal(await prisma.usuario.count(), antes);
  assert.equal(await prisma.usuario.findUnique({ where: { email: mail } }), null);
});

test("REQ-OPS-09: seed-admin.ts com ADMIN_PASSWORD válida cria o ADMIN com senha utilizável", async () => {
  const mail = email("seedadmin-ok");
  const password = "SenhaForte-De-Teste-1";
  try {
    const r = rodarSeed("prisma/seed-admin.ts", {
      ADMIN_EMAIL: mail,
      ADMIN_PASSWORD: password,
    });
    assert.equal(r.status, 0, r.stderr);
    const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: mail } });
    assert.equal(admin.tipo, "ADMIN");
    assert.equal(await bcrypt.compare(password, admin.senha), true);
  } finally {
    await prisma.usuario.deleteMany({ where: { email: mail } });
  }
});

test("REQ-OPS-09: nenhum arquivo de seed contém senha embutida", () => {
  for (const file of ["prisma/seed.ts", "prisma/seed-admin.ts"]) {
    const text = readFileSync(file, "utf8");
    assert.ok(!text.includes("EcoshopDemo@2026"), `${file} embute a senha de demo`);
    assert.ok(!text.includes("Admin@123456"), `${file} embute a senha de admin`);
  }
});

test("REQ-OPS-09: o seed-admin não imprime a senha do administrador no log", () => {
  const text = readFileSync("prisma/seed-admin.ts", "utf8");
  // a linha que mostra a senha MASCARADA (`"•".repeat(...)`) é permitida
  assert.doesNotMatch(text, /Senha: \$\{(?!"•")/);
  assert.doesNotMatch(text, /console\.(log|error)\(\s*`[^`]*ADMIN_CONFIG\.senha(?!\.length)/);
});
