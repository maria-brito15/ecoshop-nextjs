// Capacidades PERF e AUTZ (middleware) — docs/capabilities/conta-e-perfil, docs/capabilities/autorizacao
import {
  email,
  createUserDirectly,
  cookieDe,
  req,
  ctx,
  closeConnections,
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

after(closeConnections);

const passes = (r: Response) => r.headers.get("x-middleware-next") === "1";
const viaMiddleware = (path: string, cookie?: string) =>
  middleware(
    new NextRequest(`http://localhost${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );

test("REQ-PERF-01: o usuário autenticado acessa o próprio perfil (middleware e handler)", async () => {
  const u = await createUserDirectly(email("perf01"), "CLIENTE");
  const cookie = await cookieDe(u);
  const mw = await viaMiddleware(`/api/usuarios/${u.id}`, cookie);
  assert.equal(
    passes(mw),
    true,
    `o middleware bloqueou o próprio usuário (status ${mw.status})`,
  );
  const res = await buscarUsuario(
    req(`/api/usuarios/${u.id}`, { cookie }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.usuario.email, u.email);
  assert.equal("senha" in body.usuario, false);
});

test("REQ-PERF-02: o usuário edita nome e telefone do próprio perfil", async () => {
  const u = await createUserDirectly(email("perf02"), "CLIENTE");
  const res = await atualizarUsuario(
    req(`/api/usuarios/${u.id}`, {
      method: "PUT",
      cookie: await cookieDe(u),
      body: { nome: "Nome Novo Teste", telefone: "11999990000" },
    }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const saved = await prisma.usuario.findUnique({ where: { id: u.id } });
  assert.equal(saved?.nome, "Nome Novo Teste");
  assert.equal(saved?.telefone, "11999990000");
});

test("REQ-PERF-03: o usuário não consegue alterar o próprio tipo", async () => {
  const u = await createUserDirectly(email("perf03"), "CLIENTE");
  await atualizarUsuario(
    req(`/api/usuarios/${u.id}`, {
      method: "PUT",
      cookie: await cookieDe(u),
      body: { nome: "Nome Valido", tipo: "ADMIN" },
    }),
    ctx(u.id),
  );
  const saved = await prisma.usuario.findUnique({ where: { id: u.id } });
  assert.equal(saved?.tipo, "CLIENTE");
});

test("REQ-AUTZ-06: o middleware exige sessão em /perfil e /api/usuarios, e ADMIN em /painel", async () => {
  const client = await createUserDirectly(email("authz06c"), "CLIENTE");
  const admin = await createUserDirectly(email("authz06a"), "ADMIN");
  const cc = await cookieDe(client);
  const ca = await cookieDe(admin);

  const withoutProfile = await viaMiddleware("/perfil");
  assert.equal(withoutProfile.status, 307);
  assert.match(
    withoutProfile.headers.get("location") ?? "",
    /\/sign-in\?next=%2Fperfil/,
  );
  assert.equal(passes(await viaMiddleware("/perfil", cc)), true);

  const withoutApi = await viaMiddleware("/api/usuarios/1");
  assert.equal(withoutApi.status, 401);

  const clientDashboard = await viaMiddleware("/painel", cc);
  assert.equal(clientDashboard.status, 307);
  assert.equal(
    new URL(clientDashboard.headers.get("location") ?? "").pathname,
    "/",
  );
  assert.equal(passes(await viaMiddleware("/painel", ca)), true);
});

test("REQ-AUTZ-08: /ia-scan exige login (redireciona visitante, libera usuário logado)", async () => {
  const client = await createUserDirectly(email("authz08"), "CLIENTE");
  const cc = await cookieDe(client);

  const withoutSession = await viaMiddleware("/ia-scan");
  assert.equal(withoutSession.status, 307);
  assert.match(
    withoutSession.headers.get("location") ?? "",
    /\/sign-in\?next=%2Fia-scan/,
  );

  assert.equal(passes(await viaMiddleware("/ia-scan", cc)), true);
});

test(
  "REQ-PERF-04: a edição de perfil mostra a mensagem de erro devolvida pela API",
  { skip: "verificação manual: ver status.md" },
  () => {},
);
