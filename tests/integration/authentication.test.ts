// AUTH capability — docs/capabilities/authentication/spec.md
import {
  email,
  createUserDirectly,
  cookieDe,
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
import { POST as createUserAsAdmin } from "@/app/api/usuarios/route";
import { PUT as updateUser } from "@/app/api/usuarios/[id]/route";

after(closeConnections);

const PASSWORD = "Senha@12345";
async function userWithPassword(name: string) {
  const mail = email(name);
  return createUserDirectly(mail, "CLIENTE", await bcrypt.hash(PASSWORD, 4));
}
const setCookie = (r: Response) => r.headers.get("set-cookie") ?? "";

test("REQ-AUTH-01: valid login returns 200 and sets an httpOnly session cookie", async () => {
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

test("REQ-AUTH-02: wrong password and unknown email return the same 401", async () => {
  const u = await userWithPassword("auth02");
  const wrong = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: u.email, senha: "errada-123" },
    }),
  );
  const missing = await login(
    req("/api/auth", {
      method: "POST",
      body: { email: email("nao-existe"), senha: PASSWORD },
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
      body: { email: "nao-e-email", senha: "" },
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
        body: { email: email("x"), senha: "y" },
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

test("REQ-AUTH-05: valid public registration creates a CLIENTE (default) and starts the session", async () => {
  const mail = email("auth05");
  await prisma.usuario.deleteMany({ where: { email: mail } });
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: { nome: "Pessoa Teste", email: mail, senha: PASSWORD },
    }),
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.usuario.tipo, "CLIENTE");
  assert.match(setCookie(res), /^token=/);
  assert.equal("senha" in body.usuario, false);
});

test("REQ-AUTH-06: registration with an existing email returns 409", async () => {
  const u = await userWithPassword("auth06");
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: { nome: "Outra Pessoa", email: u.email, senha: PASSWORD },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-AUTH-07: no user response exposes the password (create and update by admin)", async () => {
  const admin = await createUserDirectly(email("auth07-admin"), "ADMIN");
  const cookie = await cookieDe(admin);
  const newMail = email("auth07-novo");
  await prisma.usuario.deleteMany({ where: { email: newMail } });
  const created = await createUserAsAdmin(
    req("/api/usuarios", {
      method: "POST",
      cookie,
      body: { nome: "New User", email: newMail, senha: PASSWORD },
    }),
  );
  assert.equal(created.status, 201);
  const c = await created.json();
  assert.equal(
    "senha" in c.usuario,
    false,
    "POST /api/usuarios must not return the password",
  );
  const updated = await updateUser(
    req(`/api/usuarios/${c.usuario.id}`, {
      method: "PUT",
      cookie,
      body: { nome: "Updated Name" },
    }),
    ctx(c.usuario.id),
  );
  assert.equal(updated.status, 200);
  const a = await updated.json();
  assert.equal(a.usuario.nome, "Updated Name");
  assert.equal(
    "senha" in a.usuario,
    false,
    "PUT /api/usuarios/[id] must not return the password",
  );
});

test("REQ-AUTH-08: public registration cannot create an ADMIN", async () => {
  const res = await register(
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
  const ok = await me(req("/api/auth/me", { cookie: await cookieDe(u) }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).usuario.email, u.email);
  const without = await me(req("/api/auth/me"));
  assert.equal(without.status, 401);
});

test("REQ-AUTH-11: registering as a brand (MARCA) stays pending until an ADMIN approves it", async () => {
  const mail = email("auth11");
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: {
        nome: "Test Brand",
        email: mail,
        senha: PASSWORD,
        tipo: "MARCA",
        marcaNome: `Test Brand ${mail}`,
      },
    }),
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.usuario.tipo, "CLIENTE");
  assert.equal(body.marcaPendente, true);
  const created = await prisma.usuario.findUnique({
    where: { email: mail },
    include: { marca: true },
  });
  assert.equal(
    created?.tipo,
    "CLIENTE",
    "while pending, it only has CLIENTE rights",
  );
  assert.equal(created?.marca?.status, "PENDENTE");
});

test("REQ-AUTH-14: registering as a brand (MARCA) without the brand name returns 400", async () => {
  const res = await register(
    req("/api/users", {
      method: "POST",
      body: {
        nome: "Brand Without Name",
        email: email("auth14"),
        senha: PASSWORD,
        tipo: "MARCA",
      },
    }),
  );
  assert.equal(res.status, 400);
});
