// PERF and AUTZ (middleware) capabilities — docs/capabilities/account-and-profile, docs/capabilities/authorization
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
  GET as getUser,
  PUT as updateUser,
} from "@/app/api/usuarios/[id]/route";

after(closeConnections);

const passes = (r: Response) => r.headers.get("x-middleware-next") === "1";
const viaMiddleware = (path: string, cookie?: string) =>
  middleware(
    new NextRequest(`http://localhost${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );

test("REQ-PERF-01: the authenticated user accesses their own profile (middleware and handler)", async () => {
  const u = await createUserDirectly(email("perf01"), "CLIENTE");
  const cookie = await cookieDe(u);
  const mw = await viaMiddleware(`/api/usuarios/${u.id}`, cookie);
  assert.equal(
    passes(mw),
    true,
    `the middleware blocked the user themselves (status ${mw.status})`,
  );
  const res = await getUser(
    req(`/api/usuarios/${u.id}`, { cookie }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.usuario.email, u.email);
  assert.equal("senha" in body.usuario, false);
});

test("REQ-PERF-02: the user edits the name and phone of their own profile", async () => {
  const u = await createUserDirectly(email("perf02"), "CLIENTE");
  const res = await updateUser(
    req(`/api/usuarios/${u.id}`, {
      method: "PUT",
      cookie: await cookieDe(u),
      body: { nome: "New Test Name", telefone: "11999990000" },
    }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const saved = await prisma.usuario.findUnique({ where: { id: u.id } });
  assert.equal(saved?.nome, "New Test Name");
  assert.equal(saved?.telefone, "11999990000");
});

test("REQ-PERF-03: the user cannot change their own type", async () => {
  const u = await createUserDirectly(email("perf03"), "CLIENTE");
  await updateUser(
    req(`/api/usuarios/${u.id}`, {
      method: "PUT",
      cookie: await cookieDe(u),
      body: { nome: "Valid Name", tipo: "ADMIN" },
    }),
    ctx(u.id),
  );
  const saved = await prisma.usuario.findUnique({ where: { id: u.id } });
  assert.equal(saved?.tipo, "CLIENTE");
});

test("REQ-AUTZ-06: the middleware requires a session on /perfil and /api/usuarios, and ADMIN on /painel", async () => {
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

test("REQ-AUTZ-08: /ia-scan requires login (redirects a visitor, lets a signed-in user through)", async () => {
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
  "REQ-PERF-04: the profile edit shows the error message returned by the API",
  { skip: "manual verification: see status.md" },
  () => {},
);
