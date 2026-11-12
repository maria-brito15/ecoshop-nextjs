// USR capability — docs/capabilities/user-management/spec.md
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
import { prisma } from "@/lib/db";
import { GET as list, POST as create } from "@/app/api/users/route";
import { GET as listBrands } from "@/app/api/brands/route";
import { POST as approveBrand } from "@/app/api/brands/[id]/approve/route";

after(closeConnections);

test("REQ-USR-01: the admin's user listing does not expose the password", async () => {
  const cookie = await cookieFor(
    await createUserDirectly(email("usr01-admin"), "ADMIN"),
  );
  const res = await list(req("/api/users?page=1&size=5", { cookie }));
  assert.equal(res.status, 200);
  const body = JSON.stringify(await res.json());
  assert.equal(
    body.includes('"password"'),
    false,
    "the list must not contain the password field",
  );
});

test("REQ-USR-02: creating a user as admin stores a bcrypt hash and returns 201", async () => {
  const cookie = await cookieFor(
    await createUserDirectly(email("usr02-admin"), "ADMIN"),
  );
  const fresh = email("usr02-new");
  const res = await create(
    req("/api/users", {
      method: "POST",
      cookie,
      body: { name: "New User", email: fresh, password: "Password12345" },
    }),
  );
  assert.equal(res.status, 201);
  const saved = await prisma.user.findUnique({ where: { email: fresh } });
  assert.ok(saved?.password.startsWith("$2"), "the password must be a bcrypt hash");
  assert.notEqual(saved?.password, "Password12345");
});

async function pendingBrand(baseName: string) {
  const mail = email(baseName);
  await prisma.user.deleteMany({ where: { email: mail } });
  const user = await prisma.user.create({
    data: { name: "Pending Brand", email: mail, password: "hash", type: "CUSTOMER" },
  });
  const brand = await prisma.brand.create({
    data: {
      name: `Pending Brand ${mail}`,
      userId: user.id,
      status: "PENDING",
    },
  });
  return { user, brand };
}

test("REQ-USR-03: ADMIN approves a pending brand and the associated user becomes BRAND", async () => {
  const cookie = await cookieFor(
    await createUserDirectly(email("usr03-admin"), "ADMIN"),
  );
  const { user, brand } = await pendingBrand("usr03");

  const res = await approveBrand(
    req(`/api/brands/${brand.id}/approve`, { method: "POST", cookie }),
    ctx(brand.id),
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.brand.status, "APPROVED");

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });
  assert.equal(updatedUser?.type, "BRAND");
});

test("REQ-USR-03: approving a brand that is no longer pending returns 409", async () => {
  const cookie = await cookieFor(
    await createUserDirectly(email("usr03b-admin"), "ADMIN"),
  );
  const { brand } = await pendingBrand("usr03b");

  await approveBrand(
    req(`/api/brands/${brand.id}/approve`, { method: "POST", cookie }),
    ctx(brand.id),
  );
  const second = await approveBrand(
    req(`/api/brands/${brand.id}/approve`, { method: "POST", cookie }),
    ctx(brand.id),
  );
  assert.equal(second.status, 409);
});

test("REQ-USR-05: the brand listing includes each brand's status", async () => {
  await pendingBrand("usr05");
  const res = await listBrands();
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.brands.length > 0);
  assert.ok(
    body.brands.every((m: { status: string }) => typeof m.status === "string"),
  );
});
