// Capacidade AUTH — docs/capabilities/autenticacao/spec.md
import {
  email,
  createUserDirectly,
  cookieDe,
  req,
  ctx,
  ipNovo,
  closeConnections,
  clearRateLimit,
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

after(closeConnections);

const PASSWORD = "Senha@12345";
async function userWithPassword(name: string) {
  const mail = email(name);
  return createUserDirectly(mail, "CLIENTE", await bcrypt.hash(PASSWORD, 4));
}
const setCookie = (r: Response) => r.headers.get("set-cookie") ?? "";

test("REQ-AUTH-01: login válido responde 200 e define cookie de sessão httpOnly", async () => {
  const u = await userWithPassword("auth01");
  const res = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, senha: PASSWORD },
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
  const u = await userWithPassword("auth02");
  const errada = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, senha: "errada-123" },
    }),
  );
  const inexistente = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: email("nao-existe"), senha: PASSWORD },
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
  await clearRateLimit();
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
      body: { nome: "Pessoa Teste", email: mail, senha: PASSWORD },
    }),
  );
  assert.equal(res.status, 201);
  const corpo = await res.json();
  assert.equal(corpo.usuario.tipo, "CLIENTE");
  assert.match(setCookie(res), /^token=/);
  assert.equal("senha" in corpo.usuario, false);
});

test("REQ-AUTH-06: cadastro com e-mail já existente responde 409", async () => {
  const u = await userWithPassword("auth06");
  const res = await registrar(
    req("/api/users", {
      method: "POST",
      body: { nome: "Outra Pessoa", email: u.email, senha: PASSWORD },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-AUTH-07: nenhuma resposta de usuário expõe a senha (criar e atualizar por admin)", async () => {
  const admin = await createUserDirectly(email("auth07-admin"), "ADMIN");
  const cookie = await cookieDe(admin);
  const novoMail = email("auth07-novo");
  await prisma.usuario.deleteMany({ where: { email: novoMail } });
  const criado = await criarUsuarioAdmin(
    req("/api/usuarios", {
      method: "POST",
      cookie,
      body: { nome: "Novo Usuario", email: novoMail, senha: PASSWORD },
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
        senha: PASSWORD,
        tipo: "ADMIN",
      },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-AUTH-09: logout remove o cookie de sessão", async () => {
  const res = await logout(req("/api/auth", { method: "DELETE" }));
  assert.equal(res.status, 200);
  assert.match(
    setCookie(res),
    /token=;|token=\s*;|Max-Age=0|Expires=Thu, 01 Jan 1970/i,
  );
});

test("REQ-AUTH-10: /api/auth/me devolve o usuário da sessão, ou 401 sem sessão", async () => {
  const u = await userWithPassword("auth10");
  const ok = await me(req("/api/auth/me", { cookie: await cookieDe(u) }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).usuario.email, u.email);
  const sem = await me(req("/api/auth/me"));
  assert.equal(sem.status, 401);
});

test("REQ-AUTH-11: cadastro como MARCA fica pendente de aprovação de um ADMIN", async () => {
  const mail = email("auth11");
  const res = await registrar(
    req("/api/users", {
      method: "POST",
      body: {
        nome: "Marca Teste",
        email: mail,
        senha: PASSWORD,
        tipo: "MARCA",
        marcaNome: `Marca Teste ${mail}`,
      },
    }),
  );
  assert.equal(res.status, 201);
  const corpo = await res.json();
  assert.equal(corpo.usuario.tipo, "CLIENTE");
  assert.equal(corpo.marcaPendente, true);
  const criado = await prisma.usuario.findUnique({
    where: { email: mail },
    include: { marca: true },
  });
  assert.equal(
    criado?.tipo,
    "CLIENTE",
    "enquanto pendente, só tem os direitos de CLIENTE",
  );
  assert.equal(criado?.marca?.status, "PENDENTE");
});

test("REQ-AUTH-14: cadastro como MARCA sem o nome da marca responde 400", async () => {
  const res = await registrar(
    req("/api/users", {
      method: "POST",
      body: {
        nome: "Marca Sem Nome",
        email: email("auth14"),
        senha: PASSWORD,
        tipo: "MARCA",
      },
    }),
  );
  assert.equal(res.status, 400);
});
