// Capacidade AUTH — docs/capabilities/autenticacao/spec.md
import {
  email,
  criarUsuarioDireto,
  cookieDe,
  req,
  ctx,
  ipNovo,
  encerrar,
  limparRateLimit,
} from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { POST as login, DELETE as logout } from "@/app/api/auth/route";
import { POST as registrar } from "@/app/api/users/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as criarUsuarioAdmin } from "@/app/api/usuarios/route";
import { PUT as atualizarUsuario } from "@/app/api/usuarios/[id]/route";

after(encerrar);

const SENHA = "Senha@12345";
async function usuarioComSenha(nome: string) {
  const mail = email(nome);
  return criarUsuarioDireto(mail, "CLIENTE", await bcrypt.hash(SENHA, 4));
}
const setCookie = (r: Response) => r.headers.get("set-cookie") ?? "";

test("REQ-AUTH-01: login válido responde 200 e define cookie de sessão httpOnly", async () => {
  const u = await usuarioComSenha("auth01");
  const res = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, senha: SENHA },
    }),
  );
  assert.equal(res.status, 200);
  const c = setCookie(res);
  assert.match(c, /^token=/);
  assert.match(c, /HttpOnly/i);
  assert.match(c, /SameSite=lax/i);
  assert.equal("senha" in (await res.json()).usuario, false);
});

test("REQ-AUTH-02: senha errada e e-mail inexistente respondem o mesmo 401", async () => {
  const u = await usuarioComSenha("auth02");
  const errada = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, senha: "errada-123" },
    }),
  );
  const inexistente = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: email("nao-existe"), senha: SENHA },
    }),
  );
  assert.equal(errada.status, 401);
  assert.equal(inexistente.status, 401);
  assert.deepEqual(await errada.json(), await inexistente.json());
});

test("REQ-AUTH-03: corpo de login inválido responde 400", async () => {
  const res = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: "nao-e-email", senha: "" },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-AUTH-04: mais de 10 tentativas de login por minuto no mesmo IP respondem 429", async () => {
  await limparRateLimit();
  const ip = ipNovo();
  let ultimo = 0;
  for (let i = 0; i < 12; i++) {
    const res = await login(
      req("/api/auth", {
        method: "POST",
        ip,
        body: { email: email("x"), senha: "y" },
      }),
    );
    ultimo = res.status;
    if (i < 10)
      assert.notEqual(
        ultimo,
        429,
        `tentativa ${i + 1} não deveria ser bloqueada`,
      );
  }
  assert.equal(ultimo, 429);
});

test("REQ-AUTH-05: cadastro público válido cria CLIENTE (padrão) e inicia a sessão", async () => {
  const mail = email("auth05");
  await prisma.usuario.deleteMany({ where: { email: mail } });
  const res = await registrar(
    req("/api/users", {
      method: "POST",
      body: { nome: "Pessoa Teste", email: mail, senha: SENHA },
    }),
  );
  assert.equal(res.status, 201);
  const corpo = await res.json();
  assert.equal(corpo.usuario.tipo, "CLIENTE");
  assert.match(setCookie(res), /^token=/);
  assert.equal("senha" in corpo.usuario, false);
});

test("REQ-AUTH-06: cadastro com e-mail já existente responde 409", async () => {
  const u = await usuarioComSenha("auth06");
  const res = await registrar(
    req("/api/users", {
      method: "POST",
      body: { nome: "Outra Pessoa", email: u.email, senha: SENHA },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-AUTH-07: nenhuma resposta de usuário expõe a senha (criar e atualizar por admin)", async () => {
  const admin = await criarUsuarioDireto(email("auth07-admin"), "ADMIN");
  const cookie = await cookieDe(admin);
  const novoMail = email("auth07-novo");
  await prisma.usuario.deleteMany({ where: { email: novoMail } });
  const criado = await criarUsuarioAdmin(
    req("/api/usuarios", {
      method: "POST",
      cookie,
      body: { nome: "Novo Usuario", email: novoMail, senha: SENHA },
    }),
  );
  assert.equal(criado.status, 201);
  const c = await criado.json();
  assert.equal(
    "senha" in c.usuario,
    false,
    "POST /api/usuarios não pode devolver senha",
  );
  const atualizado = await atualizarUsuario(
    req(`/api/usuarios/${c.usuario.id}`, {
      method: "PUT",
      cookie,
      body: { nome: "Nome Atualizado" },
    }),
    ctx(c.usuario.id),
  );
  assert.equal(atualizado.status, 200);
  const a = await atualizado.json();
  assert.equal(a.usuario.nome, "Nome Atualizado");
  assert.equal(
    "senha" in a.usuario,
    false,
    "PUT /api/usuarios/[id] não pode devolver senha",
  );
});

test("REQ-AUTH-08: o cadastro público não aceita criar ADMIN", async () => {
  const res = await registrar(
    req("/api/users", {
      method: "POST",
      body: {
        nome: "Pessoa Admin",
        email: email("auth08"),
        senha: SENHA,
        tipo: "ADMIN",
      },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-AUTH-09: logout remove o cookie de sessão", async () => {
  const res = await logout();
  assert.equal(res.status, 200);
  assert.match(
    setCookie(res),
    /token=;|token=\s*;|Max-Age=0|Expires=Thu, 01 Jan 1970/i,
  );
});

test("REQ-AUTH-10: /api/auth/me devolve o usuário da sessão, ou 401 sem sessão", async () => {
  const u = await usuarioComSenha("auth10");
  const ok = await me(req("/api/auth/me", { cookie: await cookieDe(u) }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).usuario.email, u.email);
  const sem = await me(req("/api/auth/me"));
  assert.equal(sem.status, 401);
});

test(
  "REQ-AUTH-11: cadastro como MARCA fica pendente de aprovação de um ADMIN",
  { todo: "ainda não implementado (decisão do dono, 2026-11-10)" },
  async () => {
    const mail = email("auth11");
    const res = await registrar(
      req("/api/users", {
        method: "POST",
        body: { nome: "Marca Teste", email: mail, senha: SENHA, tipo: "MARCA" },
      }),
    );
    assert.equal(res.status, 201);
    const criado = await prisma.usuario.findUnique({ where: { email: mail } });
    assert.notEqual(
      criado?.tipo,
      "MARCA",
      "enquanto pendente, não pode ter os direitos de MARCA",
    );
  },
);
