// Capacidades PERF e AUTZ (middleware) — docs/capabilities/conta-e-perfil, docs/capabilities/autorizacao
import {
  email,
  criarUsuarioDireto,
  cookieDe,
  req,
  ctx,
  encerrar,
} from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { middleware } from "@/middleware";
import {
  GET as buscarUsuario,
  PUT as atualizarUsuario,
} from "@/app/api/usuarios/[id]/route";

after(encerrar);

const passa = (r: Response) => r.headers.get("x-middleware-next") === "1";
const viaMiddleware = (path: string, cookie?: string) =>
  middleware(
    new NextRequest(`http://localhost${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );

test("REQ-PERF-01: o usuário autenticado acessa o próprio perfil (middleware e handler)", async () => {
  const u = await criarUsuarioDireto(email("perf01"), "CLIENTE");
  const cookie = await cookieDe(u);
  const mw = await viaMiddleware(`/api/usuarios/${u.id}`, cookie);
  assert.equal(
    passa(mw),
    true,
    `o middleware bloqueou o próprio usuário (status ${mw.status})`,
  );
  const res = await buscarUsuario(
    req(`/api/usuarios/${u.id}`, { cookie }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const corpo = await res.json();
  assert.equal(corpo.usuario.email, u.email);
  assert.equal("senha" in corpo.usuario, false);
});

test("REQ-PERF-02: o usuário edita nome e telefone do próprio perfil", async () => {
  const u = await criarUsuarioDireto(email("perf02"), "CLIENTE");
  const res = await atualizarUsuario(
    req(`/api/usuarios/${u.id}`, {
      method: "PUT",
      cookie: await cookieDe(u),
      body: { nome: "Nome Novo Teste", telefone: "11999990000" },
    }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const gravado = await prisma.usuario.findUnique({ where: { id: u.id } });
  assert.equal(gravado?.nome, "Nome Novo Teste");
  assert.equal(gravado?.telefone, "11999990000");
});

test("REQ-PERF-03: o usuário não consegue alterar o próprio tipo", async () => {
  const u = await criarUsuarioDireto(email("perf03"), "CLIENTE");
  await atualizarUsuario(
    req(`/api/usuarios/${u.id}`, {
      method: "PUT",
      cookie: await cookieDe(u),
      body: { nome: "Nome Valido", tipo: "ADMIN" },
    }),
    ctx(u.id),
  );
  const gravado = await prisma.usuario.findUnique({ where: { id: u.id } });
  assert.equal(gravado?.tipo, "CLIENTE");
});

test("REQ-AUTZ-06: o middleware exige sessão em /perfil e /api/usuarios, e ADMIN em /painel", async () => {
  const cliente = await criarUsuarioDireto(email("authz06c"), "CLIENTE");
  const admin = await criarUsuarioDireto(email("authz06a"), "ADMIN");
  const cc = await cookieDe(cliente);
  const ca = await cookieDe(admin);

  const semPerfil = await viaMiddleware("/perfil");
  assert.equal(semPerfil.status, 307);
  assert.match(
    semPerfil.headers.get("location") ?? "",
    /\/sign-in\?next=%2Fperfil/,
  );
  assert.equal(passa(await viaMiddleware("/perfil", cc)), true);

  const semApi = await viaMiddleware("/api/usuarios/1");
  assert.equal(semApi.status, 401);

  const painelCliente = await viaMiddleware("/painel", cc);
  assert.equal(painelCliente.status, 307);
  assert.equal(
    new URL(painelCliente.headers.get("location") ?? "").pathname,
    "/",
  );
  assert.equal(passa(await viaMiddleware("/painel", ca)), true);
});

test(
  "REQ-PERF-04: a edição de perfil mostra a mensagem de erro devolvida pela API",
  { skip: "verificação manual: ver status.md" },
  () => {},
);
