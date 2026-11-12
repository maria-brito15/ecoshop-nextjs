// AUTH capability — docs/capabilities/authentication/spec.md
import {
  email,
  createUserDirectly,
  cookieFor,
  req,
  ctx,
  newIp,
  closeConnections,
  clearRateLimit,
} from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { POST as login, DELETE as logout } from "@/app/api/auth/route";
import { POST as register } from "@/app/api/users/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as createUserAsAdmin } from "@/app/api/users/route";
import { PUT as updateUser } from "@/app/api/users/[id]/route";

after(closeConnections);

const PASSWORD = "Password@12345";
async function userWithPassword(name: string) {
  const mail = email(name);
  return createUserDirectly(mail, "CUSTOMER", await bcrypt.hash(PASSWORD, 4));
}
const setCookie = (r: Response) => r.headers.get("set-cookie") ?? "";

test("REQ-AUTH-01: valid login returns 200 and sets an httpOnly session cookie", async () => {
  const u = await userWithPassword("auth01");
  const res = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, password: PASSWORD },
    }),
  );
  assert.equal(res.status, 200);
  const c = setCookie(res);
  assert.match(c, /^token=/);
  assert.match(c, /HttpOnly/i);
  assert.match(c, /SameSite=lax/i);
  assert.equal("password" in (await res.json()).user, false);
});

test("REQ-AUTH-02: wrong password and unknown email return the same 401", async () => {
  const u = await userWithPassword("auth02");
  const wrong = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, password: "wrong-123" },
    }),
  );
  const missing = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: email("does-not-exist"), password: PASSWORD },
    }),
  );
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.deepEqual(await wrong.json(), await missing.json());
});

test("REQ-AUTH-03: invalid login body returns 400", async () => {
  const res = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: "not-an-email", password: "" },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-AUTH-04: more than 10 login attempts per minute from the same IP return 429", async () => {
  await clearRateLimit();
  const ip = newIp();
  let last = 0;
  for (let i = 0; i < 12; i++) {
    const res = await login(
      req("/api/auth", {
        method: "POST",
        ip,
        body: { email: email("x"), password: "y" },
      }),
    );
    last = res.status;
    if (i < 10)
      assert.notEqual(
        last,
        429,
        `attempt ${i + 1} should not have been blocked`,
      );
  }
  assert.equal(last, 429);
});

test("REQ-AUTH-05: valid public registration creates a CUSTOMER (default) and starts the session", async () => {
  const mail = email("auth05");
  await prisma.user.deleteMany({ where: { email: mail } });
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: { name: "Test Person", email: mail, password: PASSWORD },
    }),
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.type, "CUSTOMER");
  assert.match(setCookie(res), /^token=/);
  assert.equal("password" in body.user, false);
});

test("REQ-AUTH-06: registration with an existing email returns 409", async () => {
  const u = await userWithPassword("auth06");
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: { name: "Another Person", email: u.email, password: PASSWORD },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-AUTH-07: no user response exposes the password (create and update by admin)", async () => {
  const admin = await createUserDirectly(email("auth07-admin"), "ADMIN");
  const cookie = await cookieFor(admin);
  const newMail = email("auth07-new");
  await prisma.user.deleteMany({ where: { email: newMail } });
  const created = await createUserAsAdmin(
    req("/api/users", {
      method: "POST",
      cookie,
      body: { name: "New User", email: newMail, password: PASSWORD },
    }),
  );
  assert.equal(created.status, 201);
  const c = await created.json();
  assert.equal(
    "password" in c.user,
    false,
    "POST /api/users must not return the password",
  );
  const updated = await updateUser(
    req(`/api/users/${c.user.id}`, {
      method: "PUT",
      cookie,
      body: { name: "Updated Name" },
    }),
    ctx(c.user.id),
  );
  assert.equal(updated.status, 200);
  const a = await updated.json();
  assert.equal(a.user.name, "Updated Name");
  assert.equal(
    "password" in a.user,
    false,
    "PUT /api/users/[id] must not return the password",
  );
});

test("REQ-AUTH-08: public registration cannot create an ADMIN", async () => {
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: {
        name: "Admin Person",
        email: email("auth08"),
        password: PASSWORD,
        type: "ADMIN",
      },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-AUTH-09: logout removes the session cookie", async () => {
  const res = await logout(req("/api/auth", { method: "DELETE" }));
  assert.equal(res.status, 200);
  assert.match(
    setCookie(res),
    /token=;|token=\s*;|Max-Age=0|Expires=Thu, 01 Jan 1970/i,
  );
});

test("REQ-AUTH-10: /api/auth/me returns the session user, or 401 without a session", async () => {
  const u = await userWithPassword("auth10");
  const ok = await me(req("/api/auth/me", { cookie: await cookieFor(u) }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).user.email, u.email);
  const without = await me(req("/api/auth/me"));
  assert.equal(without.status, 401);
});

test("REQ-AUTH-11: registering as a brand (BRAND) stays pending until an ADMIN approves it", async () => {
  const mail = email("auth11");
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: {
        name: "Test Brand",
        email: mail,
        password: PASSWORD,
        type: "BRAND",
        brandName: `Test Brand ${mail}`,
      },
    }),
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.type, "CUSTOMER");
  assert.equal(body.pendingBrand, true);
  const created = await prisma.user.findUnique({
    where: { email: mail },
    include: { brand: true },
  });
  assert.equal(
    created?.type,
    "CUSTOMER",
    "while pending, it only has CUSTOMER rights",
  );
  assert.equal(created?.brand?.status, "PENDING");
});

test("REQ-AUTH-14: registering as a brand (BRAND) without the brand name returns 400", async () => {
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: {
        name: "Brand Without Name",
        email: email("auth14"),
        password: PASSWORD,
        type: "BRAND",
      },
    }),
  );
  assert.equal(res.status, 400);
});
