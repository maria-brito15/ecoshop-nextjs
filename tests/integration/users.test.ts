// Capacidade USR — docs/capabilities/gestao-de-usuarios/spec.md
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
import { prisma } from "@/lib/db";
import { GET as list, POST as create } from "@/app/api/usuarios/route";
import { GET as listBrands } from "@/app/api/marcas/route";
import { POST as approveBrand } from "@/app/api/marcas/[id]/aprovar/route";

after(closeConnections);

test("REQ-USR-01: the admin's user listing does not expose the password", async () => {
  const cookie = await cookieDe(
    await createUserDirectly(email("usr01-admin"), "ADMIN"),
  );
  const res = await list(req("/api/usuarios?page=1&size=5", { cookie }));
  assert.equal(res.status, 200);
  const body = JSON.stringify(await res.json());
  assert.equal(
    body.includes('"senha"'),
    false,
    "the list must not contain the password field",
  );
});

test("REQ-USR-02: creating a user as admin stores a bcrypt hash and returns 201", async () => {
  const cookie = await cookieDe(
    await createUserDirectly(email("usr02-admin"), "ADMIN"),
  );
  const fresh = email("usr02-novo");
  const res = await create(
    req("/api/usuarios", {
      method: "POST",
      cookie,
      body: { nome: "New User", email: fresh, senha: "Senha12345" },
    }),
  );
  assert.equal(res.status, 201);
  const saved = await prisma.usuario.findUnique({ where: { email: fresh } });
  assert.ok(saved?.senha.startsWith("$2"), "the password must be a bcrypt hash");
  assert.notEqual(saved?.senha, "Senha12345");
});

async function pendingBrand(baseName: string) {
  const mail = email(baseName);
  await prisma.usuario.deleteMany({ where: { email: mail } });
  const user = await prisma.usuario.create({
    data: { nome: "Pending Brand", email: mail, senha: "hash", tipo: "CLIENTE" },
  });
  const brand = await prisma.marca.create({
    data: {
      nome: `Pending Brand ${mail}`,
      usuarioId: user.id,
      status: "PENDENTE",
    },
  });
  return { usuario: user, marca: brand };
}

test("REQ-USR-03: ADMIN approves a pending brand and the associated user becomes MARCA", async () => {
  const cookie = await cookieDe(
    await createUserDirectly(email("usr03-admin"), "ADMIN"),
  );
  const { usuario: user, marca: brand } = await pendingBrand("usr03");

  const res = await approveBrand(
    req(`/api/marcas/${brand.id}/aprovar`, { method: "POST", cookie }),
    ctx(brand.id),
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.marca.status, "APROVADA");

  const updatedUser = await prisma.usuario.findUnique({
    where: { id: user.id },
  });
  assert.equal(updatedUser?.tipo, "MARCA");
});

test("REQ-USR-03: approving a brand that is no longer pending returns 409", async () => {
  const cookie = await cookieDe(
    await createUserDirectly(email("usr03b-admin"), "ADMIN"),
  );
  const { marca: brand } = await pendingBrand("usr03b");

  await approveBrand(
    req(`/api/marcas/${brand.id}/aprovar`, { method: "POST", cookie }),
    ctx(brand.id),
  );
  const second = await approveBrand(
    req(`/api/marcas/${brand.id}/aprovar`, { method: "POST", cookie }),
    ctx(brand.id),
  );
  assert.equal(second.status, 409);
});

test("REQ-USR-05: the brand listing includes each brand's status", async () => {
  await pendingBrand("usr05");
  const res = await listBrands();
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.marcas.length > 0);
  assert.ok(
    body.marcas.every((m: { status: string }) => typeof m.status === "string"),
  );
});
