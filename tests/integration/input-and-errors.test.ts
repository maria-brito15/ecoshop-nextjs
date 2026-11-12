/**
 * Spec 009: validated input and explicit errors (Constitution Art. VI, VII and VIII).
 *
 * Most of it does NOT need a database: the error mapper, `parseId`, the schemas,
 * `?next=`, the timeouts and the routes that answer 400 before touching the database.
 * The tests in the "WITH DATABASE" block (end-to-end 404/409, case-insensitive
 * search) need Postgres and run in CI.
 */
import {
  email,
  createUserDirectly,
  cookieFor,
  req,
  ctx,
  closeConnections,
  stubFetch,
  json,
} from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ResourceNotFound, BusinessConflict } from "@/lib/errors/domain";
import { mapError } from "@/lib/http/responses";
import { parseId } from "@/lib/schemas/id";
import {
  loginSchema,
  adminRegistrationSchema,
  publicRegistrationSchema,
  updateUserSchema,
} from "@/lib/schemas/user";
import { chatSchema } from "@/lib/schemas/ai-chat";
import { localPathOrRoot } from "@/lib/http/next-url";
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import { classifyImage } from "@/lib/ai/providers/azure-vision";
import { generateText } from "@/lib/ai/providers/gemini-chat";
import { analyzeImage } from "@/lib/ai";
import {
  GET as productGet,
  PUT as productPut,
  DELETE as productDelete,
} from "@/app/api/products/[id]/route";
import {
  GET as categoryGet,
  PUT as categoryPut,
  DELETE as categoryDelete,
} from "@/app/api/categories/[id]/route";
import {
  GET as brandGet,
  PUT as brandPut,
  DELETE as brandDelete,
} from "@/app/api/brands/[id]/route";
import {
  GET as certificateGet,
  PUT as certificatePut,
  DELETE as certificateDelete,
} from "@/app/api/certificates/[id]/route";
import {
  GET as photosGet,
  DELETE as photosDelete,
} from "@/app/api/products/[id]/photos/route";
import {
  GET as userGet,
  PUT as userPut,
  DELETE as userDelete,
} from "@/app/api/users/[id]/route";
import { POST as approveBrand } from "@/app/api/brands/[id]/approve/route";
import { POST as chat } from "@/app/api/ai/chat/route";
import { POST as register } from "@/app/api/users/route";
import { POST as login } from "@/app/api/auth/route";

after(closeConnections);

const INVALID_IDS = ["abc", "0", "-1", "1.5", "1e3", " 7", "2147483648", ""];

const admin = () => cookieFor({ id: 987654, email: "adm@test.local", type: "ADMIN" });

// ---------------------------------------------------------------------------
// Error mapper (Art. VII) — REQ-USR-07
// ---------------------------------------------------------------------------

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("failure", {
    code,
    clientVersion: "test",
  });

test("REQ-USR-07: a domain error becomes the right HTTP response (404 and 409), with the original message", async () => {
  const notFound = mapError(new ResourceNotFound("User"), "Anything");
  assert.equal(notFound?.status, 404);
  assert.deepEqual(await notFound?.json(), { error: "User not found" });

  const conflict = mapError(new BusinessConflict("Email already registered"), "Anything");
  assert.equal(conflict?.status, 409);
  assert.deepEqual(await conflict?.json(), { error: "Email already registered" });
});

test("REQ-USR-07: a Prisma code becomes 404 (P2025) and 409 (P2002, P2003); unknown codes produce no response", () => {
  assert.equal(mapError(prismaError("P2025"), "User")?.status, 404);
  assert.equal(mapError(prismaError("P2002"), "User")?.status, 409);
  assert.equal(mapError(prismaError("P2003"), "User")?.status, 409);
  assert.equal(mapError(prismaError("P2999"), "User"), null);
});

test("REQ-USR-07: the mapper never decides from the message text (Art. VII.2)", () => {
  for (const text of ["P2025", "P2003", "EMAIL_ALREADY_REGISTERED", "BRAND_NOT_PENDING"]) {
    assert.equal(mapError(new Error(text), "User"), null, text);
  }
  assert.equal(
    mapError(new Error("message with P2025 in the middle"), "User"),
    null,
  );
});

// ---------------------------------------------------------------------------
// parseId e rotas [id] — REQ-CAT-09, PROD-06, MIDIA-05, REF-05, USR-06
// ---------------------------------------------------------------------------

test("REQ-REF-05: parseId accepts only positive integers up to 4 bytes, no sign, leading zero or notation", () => {
  assert.equal(parseId("1"), 1);
  assert.equal(parseId("42"), 42);
  assert.equal(parseId("2147483647"), 2147483647);
  for (const invalid of [...INVALID_IDS, "007", "7abc", "+7", "١٢"]) {
    assert.equal(parseId(invalid), null, JSON.stringify(invalid));
  }
});

test("REQ-CAT-09: GET /api/products/[id] with an invalid id returns 400", async () => {
  for (const id of INVALID_IDS.filter((i) => i !== "")) {
    const res = await productGet(req(`/api/products/${id}`), ctx(id));
    assert.equal(res.status, 400, `id=${JSON.stringify(id)}`);
  }
});

test("REQ-PROD-06: PUT and DELETE /api/products/[id] with an invalid id return 400 (valid body)", async () => {
  const cookie = await admin();
  for (const id of ["abc", "0", "1.5"]) {
    const put = await productPut(
      req(`/api/products/${id}`, { method: "PUT", cookie, body: { name: "New name" } }),
      ctx(id),
    );
    assert.equal(put.status, 400, `PUT id=${id}`);
    const del = await productDelete(
      req(`/api/products/${id}`, { method: "DELETE", cookie }),
      ctx(id),
    );
    assert.equal(del.status, 400, `DELETE id=${id}`);
  }
});

test("REQ-REF-05: categories, brands and certificates with an invalid id return 400 on GET, PUT and DELETE", async () => {
  const cookie = await admin();
  const resources = [
    ["categories", categoryGet, categoryPut, categoryDelete],
    ["brands", brandGet, brandPut, brandDelete],
    ["certificates", certificateGet, certificatePut, certificateDelete],
  ] as const;
  for (const [name, get, put, del] of resources) {
    for (const id of ["abc", "0", "1.5"]) {
      const url = `/api/${name}/${id}`;
      assert.equal((await get(req(url), ctx(id))).status, 400, `GET ${name} ${id}`);
      assert.equal(
        (await put(req(url, { method: "PUT", cookie, body: { name: "Valid name" } }), ctx(id))).status,
        400,
        `PUT ${name} ${id}`,
      );
      assert.equal(
        (await del(req(url, { method: "DELETE", cookie }), ctx(id))).status,
        400,
        `DELETE ${name} ${id}`,
      );
    }
  }
});

test("REQ-MIDIA-05: photo routes with an invalid id return 400", async () => {
  const cookie = await admin();
  for (const id of ["abc", "1.5", "0", "-3", "1e3"]) {
    assert.equal(
      (await photosGet(req(`/api/products/${id}/photos`), ctx(id))).status,
      400,
      `GET id=${id}`,
    );
    assert.equal(
      (await photosDelete(req(`/api/products/${id}/photos?name=1_x.png`, { method: "DELETE", cookie }), ctx(id))).status,
      400,
      `DELETE id=${id}`,
    );
  }
});

test("REQ-USR-06: /api/users/[id] and approve brand with an invalid id return 400 for ADMIN", async () => {
  const cookie = await admin();
  for (const id of ["abc", "0", "1.5"]) {
    assert.equal((await userGet(req(`/api/users/${id}`, { cookie }), ctx(id))).status, 400, `GET ${id}`);
    assert.equal(
      (await userPut(req(`/api/users/${id}`, { method: "PUT", cookie, body: { name: "Valid name" } }), ctx(id))).status,
      400,
      `PUT ${id}`,
    );
    assert.equal(
      (await userDelete(req(`/api/users/${id}`, { method: "DELETE", cookie }), ctx(id))).status,
      400,
      `DELETE ${id}`,
    );
    assert.equal(
      (await approveBrand(req(`/api/brands/${id}/approve`, { method: "POST", cookie }), ctx(id))).status,
      400,
      `approve ${id}`,
    );
  }
});

test("REQ-USR-08: an ADMIN who tries to delete their own account gets 409 (the rule applies before any database access)", async () => {
  const me = { id: 424242, email: "auto-del@test.local", type: "ADMIN" as const };
  const cookie = await cookieFor(me);
  const res = await userDelete(
    req(`/api/users/${me.id}`, { method: "DELETE", cookie }),
    ctx(me.id),
  );
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: "You cannot delete your own account" });
});

test("REQ-USR-06: the session is checked before the id (a visitor gets 403, not 400)", async () => {
  const res = await userGet(req("/api/users/abc"), ctx("abc"));
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------------------
// Email and password — REQ-AUTH-15 and REQ-AUTH-16
// ---------------------------------------------------------------------------

test("REQ-AUTH-15: the schemas normalize the email (spaces and case) on login, registration and update", () => {
  const dirty = "  Foo.Bar@Example.COM ";
  const clean = "foo.bar@example.com";
  assert.equal(loginSchema.parse({ email: dirty, password: "x" }).email, clean);
  assert.equal(
    adminRegistrationSchema.parse({ name: "John Doe", email: dirty, password: "Password12345" }).email,
    clean,
  );
  assert.equal(
    publicRegistrationSchema.parse({ name: "John Doe", email: dirty, password: "Password12345" }).email,
    clean,
  );
  assert.equal(updateUserSchema.parse({ email: dirty }).email, clean);
});

test("REQ-AUTH-16: a password above 72 bytes is refused; 72 bytes is accepted (counts bytes, not characters)", () => {
  const base = { name: "John Doe", email: "a@b.com" };
  assert.ok(publicRegistrationSchema.safeParse({ ...base, password: "a".repeat(72) }).success);
  assert.ok(!publicRegistrationSchema.safeParse({ ...base, password: "a".repeat(73) }).success);
  // "ç" takes 2 bytes in UTF-8: 37 × 2 = 74 bytes, but only 37 characters
  assert.ok(!publicRegistrationSchema.safeParse({ ...base, password: "ç".repeat(37) }).success);
  assert.ok(publicRegistrationSchema.safeParse({ ...base, password: "ç".repeat(36) }).success);
  assert.ok(!adminRegistrationSchema.safeParse({ ...base, password: "a".repeat(73) }).success);
  assert.ok(!updateUserSchema.safeParse({ password: "a".repeat(73) }).success);
});

// ---------------------------------------------------------------------------
// login ?next= — REQ-AUTH-17
// ---------------------------------------------------------------------------

test("REQ-AUTH-17: localPathOrRoot accepts a local path and sends everything else to /", () => {
  assert.equal(localPathOrRoot("/profile"), "/profile");
  assert.equal(localPathOrRoot("/products?category=2#topo"), "/products?category=2#topo");
  assert.equal(localPathOrRoot("/"), "/");
  for (const dangerous of [
    null,
    "",
    "profile",
    "//evil.com",
    "///evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "/\nx",
    "/\tx",
    " /profile",
    "data:text/html,x",
  ]) {
    assert.equal(localPathOrRoot(dangerous), "/", JSON.stringify(dangerous));
  }
});

// ---------------------------------------------------------------------------
// Chat — REQ-CHAT-08 e REQ-CHAT-09
// ---------------------------------------------------------------------------

const item = (text: string) => ({ role: "user" as const, parts: [{ text }] });

test("REQ-CHAT-08: the schema refuses a history with more than 20 items, text above 2000 characters or more than 5 parts", () => {
  const ok = (history: unknown[]) => chatSchema.safeParse({ message: "oi", history }).success;
  assert.ok(ok(Array.from({ length: 20 }, () => item("oi"))));
  assert.ok(!ok(Array.from({ length: 21 }, () => item("oi"))));
  assert.ok(ok([item("a".repeat(2000))]));
  assert.ok(!ok([item("a".repeat(2001))]));
  assert.ok(!ok([{ role: "user", parts: Array.from({ length: 6 }, () => ({ text: "x" })) }]));
});

test("REQ-CHAT-08: the Gemini key goes in the x-goog-api-key header, never in the URL", async () => {
  process.env.GEMINI_KEY = "gemini-test-key-123";
  const cookie = await cookieFor({ id: 111, email: "chat08@test.local", type: "CUSTOMER" });
  let usedUrl = "";
  let headers: Record<string, string> = {};
  const restore = stubFetch((url, init) => {
    usedUrl = url;
    headers = (init?.headers ?? {}) as Record<string, string>;
    return json({ candidates: [{ content: { parts: [{ text: "ok" }] } }] });
  });
  try {
    const res = await chat(req("/api/ai/chat", { method: "POST", cookie, body: { message: "How do I recycle batteries?" } }));
    assert.equal(res.status, 200);
    assert.ok(!usedUrl.includes("key="), "the key must not be in the URL");
    assert.equal(headers["x-goog-api-key"], "gemini-test-key-123");

    // the same applies to the provider used by EcoScan
    usedUrl = "";
    headers = {};
    await generateText("prompt");
    assert.ok(!usedUrl.includes("key="));
    assert.equal(headers["x-goog-api-key"], "gemini-test-key-123");
  } finally {
    restore();
  }
});

test("REQ-CHAT-08: a history with 21 items returns 400", async () => {
  process.env.GEMINI_KEY = "gemini-test-key-123";
  const cookie = await cookieFor({ id: 112, email: "chat08b@test.local", type: "CUSTOMER" });
  const res = await chat(
    req("/api/ai/chat", {
      method: "POST",
      cookie,
      body: { message: "oi", history: Array.from({ length: 21 }, () => item("oi")) },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-CHAT-09: if the Gemini call throws, the chat returns 502 (not 500)", async () => {
  process.env.GEMINI_KEY = "gemini-test-key-123";
  const cookie = await cookieFor({ id: 113, email: "chat09@test.local", type: "CUSTOMER" });
  const restore = stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  try {
    const res = await chat(req("/api/ai/chat", { method: "POST", cookie, body: { message: "oi" } }));
    assert.equal(res.status, 502);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// Timeouts — REQ-SCAN-09
// ---------------------------------------------------------------------------

/** `fetch` that never answers, but rejects when the `signal` aborts. */
const fetchHangingUntilAborted = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_, rejects) => {
    if (!init?.signal) return; // without a signal it hangs: the racer below reports the failure
    init.signal.addEventListener("abort", () => rejects(init.signal!.reason));
  });

/** Fails clearly (instead of hanging the test) if the promise does not finish. */
const withTimeout = <T,>(promise: Promise<T>, ms = 2000) =>
  Promise.race([
    promise,
    new Promise<never>((_, rejects) => setTimeout(() => rejects(new Error("no timeout: the call hung")), ms)),
  ]);

test("REQ-SCAN-09: fetchWithTimeout aborts a call that does not respond", async () => {
  const restore = stubFetch(fetchHangingUntilAborted);
  try {
    await assert.rejects(() => withTimeout(fetchWithTimeout("http://example.test", {}, 20)), (e: Error) => !/no timeout/.test(e.message));
  } finally {
    restore();
  }
});

test("REQ-SCAN-09: Azure not responding within the time limit becomes a handled failure (null), not an exception", async () => {
  const restore = stubFetch(fetchHangingUntilAborted);
  try {
    assert.equal(await withTimeout(classifyImage(Buffer.from("x"), 20)), null);
  } finally {
    restore();
  }
});

test("REQ-SCAN-09: Gemini not responding, or throwing, becomes null (the scan uses the fallback)", async () => {
  process.env.GEMINI_KEY = "gemini-test-key-123";
  let restore = stubFetch(fetchHangingUntilAborted);
  try {
    assert.equal(await withTimeout(generateText("prompt", undefined, 20)), null);
  } finally {
    restore();
  }
  restore = stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  try {
    assert.equal(await generateText("prompt"), null);
  } finally {
    restore();
  }
});

test("REQ-SCAN-05: if the Gemini network fails, the scan returns the fallback analysis (no database)", async () => {
  const restore = stubFetch((url) => {
    if (url.startsWith("https://azure.test")) {
      return json({ predictions: [{ tagName: "metal", probability: 0.9 }] });
    }
    throw new TypeError("fetch failed");
  });
  try {
    const r = await analyzeImage(Buffer.from("x"), "img-test");
    assert.equal(r.success, true);
    assert.ok((r as { sustainability_analysis?: unknown }).sustainability_analysis);
  } finally {
    restore();
  }
});

// ===========================================================================
// WITH DATABASE — run in CI (need Postgres)
// ===========================================================================

test("REQ-USR-07: PUT of an unknown user by ADMIN returns 404", async () => {
  const cookie = await cookieFor(await createUserDirectly(email("e404-admin"), "ADMIN"));
  const res = await userPut(
    req("/api/users/2147000000", { method: "PUT", cookie, body: { name: "Valid name" } }),
    ctx(2147000000),
  );
  assert.equal(res.status, 404);
});

test("REQ-USR-07: PUT with another user's email returns 409", async () => {
  const cookie = await cookieFor(await createUserDirectly(email("e409-admin"), "ADMIN"));
  const other = await createUserDirectly(email("e409-other"));
  const target = await createUserDirectly(email("e409-alvo"));
  const res = await userPut(
    req(`/api/users/${target.id}`, { method: "PUT", cookie, body: { email: other.email } }),
    ctx(target.id),
  );
  assert.equal(res.status, 409);
});

test("REQ-USR-07: DELETE of a user that has a brand returns 409 and keeps the user", async () => {
  const cookie = await cookieFor(await createUserDirectly(email("fk-admin"), "ADMIN"));
  const owner = await createUserDirectly(email("fk-owner"), "BRAND");
  await prisma.brand.create({ data: { name: `Brand FK ${owner.email}`, userId: owner.id, status: "APPROVED" } });
  const res = await userDelete(req(`/api/users/${owner.id}`, { method: "DELETE", cookie }), ctx(owner.id));
  assert.equal(res.status, 409);
  assert.ok(await prisma.user.findUnique({ where: { id: owner.id } }));
});

test("REQ-AUTH-15: registration stores the email in lowercase and refuses the same email in another case", async () => {
  const lowercase = email("case");
  const mixed = lowercase.replace("case", "CaSe").replace("@test.local", "@TEST.local");
  await prisma.user.deleteMany({ where: { email: lowercase } });
  const fresh = { name: "Case User", password: "Password12345" };

  const first = await register(req("/api/users", { method: "POST", body: { ...fresh, email: mixed } }));
  assert.equal(first.status, 201);
  assert.ok(await prisma.user.findUnique({ where: { email: lowercase } }), "stored in lowercase");

  const repeated = await register(req("/api/users", { method: "POST", body: { ...fresh, email: lowercase } }));
  assert.equal(repeated.status, 409);
});

test("REQ-AUTH-15: a legacy account with a mixed-case email keeps signing in with any case", async () => {
  const legacy = email("legacy").replace("legacy", "LeGaCy");
  await prisma.user.deleteMany({ where: { email: legacy } });
  await prisma.user.create({
    data: { name: "Legacy", email: legacy, password: await bcrypt.hash("Password12345", 4), type: "CUSTOMER" },
  });
  const res = await login(req("/api/auth", { method: "POST", body: { email: legacy.toLowerCase(), password: "Password12345" } }));
  assert.equal(res.status, 200);
});
