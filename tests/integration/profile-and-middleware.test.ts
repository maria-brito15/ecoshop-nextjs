// PERF and AUTZ (middleware) capabilities — docs/capabilities/account-and-profile, docs/capabilities/authorization
import {
  email,
  createUserDirectly,
  cookieFor,
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
} from "@/app/api/users/[id]/route";

after(closeConnections);

const passes = (r: Response) => r.headers.get("x-middleware-next") === "1";
const viaMiddleware = (path: string, cookie?: string) =>
  middleware(
    new NextRequest(`http://localhost${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );

test("REQ-PERF-01: the authenticated user accesses their own profile (middleware and handler)", async () => {
  const u = await createUserDirectly(email("perf01"), "CUSTOMER");
  const cookie = await cookieFor(u);
  const mw = await viaMiddleware(`/api/users/${u.id}`, cookie);
  assert.equal(
    passes(mw),
    true,
    `the middleware blocked the user themselves (status ${mw.status})`,
  );
  const res = await getUser(
    req(`/api/users/${u.id}`, { cookie }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.email, u.email);
  assert.equal("password" in body.user, false);
});

test("REQ-PERF-02: the user edits the name and phone of their own profile", async () => {
  const u = await createUserDirectly(email("perf02"), "CUSTOMER");
  const res = await updateUser(
    req(`/api/users/${u.id}`, {
      method: "PUT",
      cookie: await cookieFor(u),
      body: { name: "New Test Name", phone: "11999990000" },
    }),
    ctx(u.id),
  );
  assert.equal(res.status, 200);
  const saved = await prisma.user.findUnique({ where: { id: u.id } });
  assert.equal(saved?.name, "New Test Name");
  assert.equal(saved?.phone, "11999990000");
});

test("REQ-PERF-03: the user cannot change their own type", async () => {
  const u = await createUserDirectly(email("perf03"), "CUSTOMER");
  await updateUser(
    req(`/api/users/${u.id}`, {
      method: "PUT",
      cookie: await cookieFor(u),
      body: { name: "Valid Name", type: "ADMIN" },
    }),
    ctx(u.id),
  );
  const saved = await prisma.user.findUnique({ where: { id: u.id } });
  assert.equal(saved?.type, "CUSTOMER");
});

test("REQ-AUTZ-06: the middleware requires a session on /profile and /api/users/[id], and ADMIN on /dashboard", async () => {
  const client = await createUserDirectly(email("authz06c"), "CUSTOMER");
  const admin = await createUserDirectly(email("authz06a"), "ADMIN");
  const cc = await cookieFor(client);
  const ca = await cookieFor(admin);

  const withoutProfile = await viaMiddleware("/profile");
  assert.equal(withoutProfile.status, 307);
  assert.match(
    withoutProfile.headers.get("location") ?? "",
    /\/sign-in\?next=%2Fprofile/,
  );
  assert.equal(passes(await viaMiddleware("/profile", cc)), true);

  const withoutApi = await viaMiddleware("/api/users/1");
  assert.equal(withoutApi.status, 401);

  const clientDashboard = await viaMiddleware("/dashboard", cc);
  assert.equal(clientDashboard.status, 307);
  assert.equal(
    new URL(clientDashboard.headers.get("location") ?? "").pathname,
    "/",
  );
  assert.equal(passes(await viaMiddleware("/dashboard", ca)), true);
});

test("REQ-AUTZ-08: /ai-scan requires login (redirects a visitor, lets a signed-in user through)", async () => {
  const client = await createUserDirectly(email("authz08"), "CUSTOMER");
  const cc = await cookieFor(client);

  const withoutSession = await viaMiddleware("/ai-scan");
  assert.equal(withoutSession.status, 307);
  assert.match(
    withoutSession.headers.get("location") ?? "",
    /\/sign-in\?next=%2Fai-scan/,
  );

  assert.equal(passes(await viaMiddleware("/ai-scan", cc)), true);
});

test(
  "REQ-PERF-04: the profile edit shows the error message returned by the API",
  { skip: "manual verification: see status.md" },
  () => {},
);
