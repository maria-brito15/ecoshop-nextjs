/**
 * Spec 009: entrada validada e erros explícitos (Constitution Art. VI, VII e VIII).
 *
 * A maior parte NÃO precisa de banco: o mapeador de erros, `parseId`, os schemas,
 * `?next=`, os timeouts e as rotas que respondem 400 antes de tocar o banco.
 * Os testes do bloco "COM BANCO" (404/409 de ponta a ponta, busca sem diferença
 * de caixa) precisam de Postgres e rodam no CI.
 */
import {
  email,
  createUserDirectly,
  cookieDe,
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
import { ResourceNotFound, BusinessConflict } from "@/lib/errors/dominio";
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
import { analisarImagem } from "@/lib/ai";
import {
  GET as produtoGet,
  PUT as produtoPut,
  DELETE as produtoDelete,
} from "@/app/api/produtos/[id]/route";
import {
  GET as categoriaGet,
  PUT as categoriaPut,
  DELETE as categoriaDelete,
} from "@/app/api/categorias/[id]/route";
import {
  GET as marcaGet,
  PUT as marcaPut,
  DELETE as marcaDelete,
} from "@/app/api/marcas/[id]/route";
import {
  GET as certificadoGet,
  PUT as certificadoPut,
  DELETE as certificadoDelete,
} from "@/app/api/certificados/[id]/route";
import {
  GET as fotosGet,
  DELETE as fotosDelete,
} from "@/app/api/produtos/[id]/fotos/route";
import {
  GET as usuarioGet,
  PUT as usuarioPut,
  DELETE as usuarioDelete,
} from "@/app/api/usuarios/[id]/route";
import { POST as aprovarMarca } from "@/app/api/marcas/[id]/aprovar/route";
import { POST as chat } from "@/app/api/ia/chat/route";
import { POST as cadastrar } from "@/app/api/users/route";
import { POST as login } from "@/app/api/auth/route";

after(closeConnections);

const INVALID_IDS = ["abc", "0", "-1", "1.5", "1e3", " 7", "2147483648", ""];

const admin = () => cookieDe({ id: 987654, email: "adm@test.local", tipo: "ADMIN" });

// ---------------------------------------------------------------------------
// Mapeador de erros (Art. VII) — REQ-USR-07
// ---------------------------------------------------------------------------

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("failure", {
    code,
    clientVersion: "teste",
  });

test("REQ-USR-07: a domain error becomes the right HTTP response (404 and 409), with the original message", async () => {
  const notFound = mapError(new ResourceNotFound("User"), "Qualquer");
  assert.equal(notFound?.status, 404);
  assert.deepEqual(await notFound?.json(), { erro: "User not found" });

  const conflict = mapError(new BusinessConflict("Email already registered"), "Qualquer");
  assert.equal(conflict?.status, 409);
  assert.deepEqual(await conflict?.json(), { erro: "Email already registered" });
});

test("REQ-USR-07: a Prisma code becomes 404 (P2025) and 409 (P2002, P2003); unknown codes produce no response", () => {
  assert.equal(mapError(prismaError("P2025"), "User")?.status, 404);
  assert.equal(mapError(prismaError("P2002"), "User")?.status, 409);
  assert.equal(mapError(prismaError("P2003"), "User")?.status, 409);
  assert.equal(mapError(prismaError("P2999"), "User"), null);
});

test("REQ-USR-07: the mapper never decides from the message text (Art. VII.2)", () => {
  for (const text of ["P2025", "P2003", "EMAIL_JA_CADASTRADO", "MARCA_NAO_PENDENTE"]) {
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

test("REQ-CAT-09: GET /api/produtos/[id] with an invalid id returns 400", async () => {
  for (const id of INVALID_IDS.filter((i) => i !== "")) {
    const res = await produtoGet(req(`/api/produtos/${id}`), ctx(id));
    assert.equal(res.status, 400, `id=${JSON.stringify(id)}`);
  }
});

test("REQ-PROD-06: PUT and DELETE /api/produtos/[id] with an invalid id return 400 (valid body)", async () => {
  const cookie = await admin();
  for (const id of ["abc", "0", "1.5"]) {
    const put = await produtoPut(
      req(`/api/produtos/${id}`, { method: "PUT", cookie, body: { nome: "Novo nome" } }),
      ctx(id),
    );
    assert.equal(put.status, 400, `PUT id=${id}`);
    const del = await produtoDelete(
      req(`/api/produtos/${id}`, { method: "DELETE", cookie }),
      ctx(id),
    );
    assert.equal(del.status, 400, `DELETE id=${id}`);
  }
});

test("REQ-REF-05: categories, brands and certificates with an invalid id return 400 on GET, PUT and DELETE", async () => {
  const cookie = await admin();
  const resources = [
    ["categorias", categoriaGet, categoriaPut, categoriaDelete],
    ["marcas", marcaGet, marcaPut, marcaDelete],
    ["certificados", certificadoGet, certificadoPut, certificadoDelete],
  ] as const;
  for (const [name, get, put, del] of resources) {
    for (const id of ["abc", "0", "1.5"]) {
      const url = `/api/${name}/${id}`;
      assert.equal((await get(req(url), ctx(id))).status, 400, `GET ${name} ${id}`);
      assert.equal(
        (await put(req(url, { method: "PUT", cookie, body: { nome: "Valid name" } }), ctx(id))).status,
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
      (await fotosGet(req(`/api/produtos/${id}/fotos`), ctx(id))).status,
      400,
      `GET id=${id}`,
    );
    assert.equal(
      (await fotosDelete(req(`/api/produtos/${id}/fotos?nome=1_x.png`, { method: "DELETE", cookie }), ctx(id))).status,
      400,
      `DELETE id=${id}`,
    );
  }
});

test("REQ-USR-06: /api/usuarios/[id] and approve brand with an invalid id return 400 for ADMIN", async () => {
  const cookie = await admin();
  for (const id of ["abc", "0", "1.5"]) {
    assert.equal((await usuarioGet(req(`/api/usuarios/${id}`, { cookie }), ctx(id))).status, 400, `GET ${id}`);
    assert.equal(
      (await usuarioPut(req(`/api/usuarios/${id}`, { method: "PUT", cookie, body: { nome: "Valid name" } }), ctx(id))).status,
      400,
      `PUT ${id}`,
    );
    assert.equal(
      (await usuarioDelete(req(`/api/usuarios/${id}`, { method: "DELETE", cookie }), ctx(id))).status,
      400,
      `DELETE ${id}`,
    );
    assert.equal(
      (await aprovarMarca(req(`/api/marcas/${id}/aprovar`, { method: "POST", cookie }), ctx(id))).status,
      400,
      `aprovar ${id}`,
    );
  }
});

test("REQ-USR-08: an ADMIN who tries to delete their own account gets 409 (the rule applies before any database access)", async () => {
  const me = { id: 424242, email: "auto-del@test.local", tipo: "ADMIN" as const };
  const cookie = await cookieDe(me);
  const res = await usuarioDelete(
    req(`/api/usuarios/${me.id}`, { method: "DELETE", cookie }),
    ctx(me.id),
  );
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { erro: "You cannot delete your own account" });
});

test("REQ-USR-06: the session is checked before the id (a visitor gets 403, not 400)", async () => {
  const res = await usuarioGet(req("/api/usuarios/abc"), ctx("abc"));
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------------------
// E-mail e senha — REQ-AUTH-15 e REQ-AUTH-16
// ---------------------------------------------------------------------------

test("REQ-AUTH-15: the schemas normalize the email (spaces and case) on login, registration and update", () => {
  const dirty = "  Foo.Bar@Exemplo.COM ";
  const clean = "foo.bar@exemplo.com";
  assert.equal(loginSchema.parse({ email: dirty, senha: "x" }).email, clean);
  assert.equal(
    adminRegistrationSchema.parse({ nome: "Fulano", email: dirty, senha: "Senha12345" }).email,
    clean,
  );
  assert.equal(
    publicRegistrationSchema.parse({ nome: "Fulano", email: dirty, senha: "Senha12345" }).email,
    clean,
  );
  assert.equal(updateUserSchema.parse({ email: dirty }).email, clean);
});

test("REQ-AUTH-16: a password above 72 bytes is refused; 72 bytes is accepted (counts bytes, not characters)", () => {
  const base = { nome: "Fulano", email: "a@b.com" };
  assert.ok(publicRegistrationSchema.safeParse({ ...base, senha: "a".repeat(72) }).success);
  assert.ok(!publicRegistrationSchema.safeParse({ ...base, senha: "a".repeat(73) }).success);
  // "ç" ocupa 2 bytes em UTF-8: 37 × 2 = 74 bytes, mas só 37 caracteres
  assert.ok(!publicRegistrationSchema.safeParse({ ...base, senha: "ç".repeat(37) }).success);
  assert.ok(publicRegistrationSchema.safeParse({ ...base, senha: "ç".repeat(36) }).success);
  assert.ok(!adminRegistrationSchema.safeParse({ ...base, senha: "a".repeat(73) }).success);
  assert.ok(!updateUserSchema.safeParse({ senha: "a".repeat(73) }).success);
});

// ---------------------------------------------------------------------------
// ?next= do login — REQ-AUTH-17
// ---------------------------------------------------------------------------

test("REQ-AUTH-17: localPathOrRoot accepts a local path and sends everything else to /", () => {
  assert.equal(localPathOrRoot("/perfil"), "/perfil");
  assert.equal(localPathOrRoot("/produtos?categoria=2#topo"), "/produtos?categoria=2#topo");
  assert.equal(localPathOrRoot("/"), "/");
  for (const dangerous of [
    null,
    "",
    "perfil",
    "//evil.com",
    "///evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "/\nx",
    "/\tx",
    " /perfil",
    "data:text/html,x",
  ]) {
    assert.equal(localPathOrRoot(dangerous), "/", JSON.stringify(dangerous));
  }
});

// ---------------------------------------------------------------------------
// Chat — REQ-CHAT-08 e REQ-CHAT-09
// ---------------------------------------------------------------------------

const item = (text: string) => ({ role: "user" as const, parts: [{ text: text }] });

test("REQ-CHAT-08: the schema refuses a historico with more than 20 items, text above 2000 characters or more than 5 parts", () => {
  const ok = (history: unknown[]) => chatSchema.safeParse({ mensagem: "oi", historico: history }).success;
  assert.ok(ok(Array.from({ length: 20 }, () => item("oi"))));
  assert.ok(!ok(Array.from({ length: 21 }, () => item("oi"))));
  assert.ok(ok([item("a".repeat(2000))]));
  assert.ok(!ok([item("a".repeat(2001))]));
  assert.ok(!ok([{ role: "user", parts: Array.from({ length: 6 }, () => ({ text: "x" })) }]));
});

test("REQ-CHAT-08: the Gemini key goes in the x-goog-api-key header, never in the URL", async () => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
  const cookie = await cookieDe({ id: 111, email: "chat08@test.local", tipo: "CLIENTE" });
  let usedUrl = "";
  let headers: Record<string, string> = {};
  const restore = stubFetch((url, init) => {
    usedUrl = url;
    headers = (init?.headers ?? {}) as Record<string, string>;
    return json({ candidates: [{ content: { parts: [{ text: "ok" }] } }] });
  });
  try {
    const res = await chat(req("/api/ia/chat", { method: "POST", cookie, body: { mensagem: "Como reciclar pilhas?" } }));
    assert.equal(res.status, 200);
    assert.ok(!usedUrl.includes("key="), "the key must not be in the URL");
    assert.equal(headers["x-goog-api-key"], "chave-gemini-de-teste-123");

    // o mesmo vale para o provedor usado pelo EcoScan
    usedUrl = "";
    headers = {};
    await generateText("prompt");
    assert.ok(!usedUrl.includes("key="));
    assert.equal(headers["x-goog-api-key"], "chave-gemini-de-teste-123");
  } finally {
    restore();
  }
});

test("REQ-CHAT-08: a historico with 21 items returns 400", async () => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
  const cookie = await cookieDe({ id: 112, email: "chat08b@test.local", tipo: "CLIENTE" });
  const res = await chat(
    req("/api/ia/chat", {
      method: "POST",
      cookie,
      body: { mensagem: "oi", historico: Array.from({ length: 21 }, () => item("oi")) },
    }),
  );
  assert.equal(res.status, 400);
});

test("REQ-CHAT-09: if the Gemini call throws, the chat returns 502 (not 500)", async () => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
  const cookie = await cookieDe({ id: 113, email: "chat09@test.local", tipo: "CLIENTE" });
  const restore = stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  try {
    const res = await chat(req("/api/ia/chat", { method: "POST", cookie, body: { mensagem: "oi" } }));
    assert.equal(res.status, 502);
  } finally {
    restore();
  }
});

// ---------------------------------------------------------------------------
// Timeouts — REQ-SCAN-09
// ---------------------------------------------------------------------------

/** `fetch` que nunca responde, mas rejeita quando o `signal` aborta. */
const fetchHangingUntilAborted = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_, rejects) => {
    if (!init?.signal) return; // sem signal fica pendurado: o corredor abaixo acusa a falha
    init.signal.addEventListener("abort", () => rejects(init.signal!.reason));
  });

/** Falha claramente (em vez de travar o teste) se a promessa não terminar. */
const withTimeout = <T,>(promise: Promise<T>, ms = 2000) =>
  Promise.race([
    promise,
    new Promise<never>((_, rejects) => setTimeout(() => rejects(new Error("no timeout: the call hung")), ms)),
  ]);

test("REQ-SCAN-09: fetchWithTimeout aborts a call that does not respond", async () => {
  const restore = stubFetch(fetchHangingUntilAborted);
  try {
    await assert.rejects(() => withTimeout(fetchWithTimeout("http://exemplo.test", {}, 20)), (e: Error) => !/sem timeout/.test(e.message));
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
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
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
    const r = await analisarImagem(Buffer.from("x"), "img-teste");
    assert.equal(r.sucesso, true);
    assert.ok((r as { analise_sustentabilidade?: unknown }).analise_sustentabilidade);
  } finally {
    restore();
  }
});

// ===========================================================================
// COM BANCO — rodam no CI (precisam de Postgres)
// ===========================================================================

test("REQ-USR-07: PUT of an unknown user by ADMIN returns 404", async () => {
  const cookie = await cookieDe(await createUserDirectly(email("e404-admin"), "ADMIN"));
  const res = await usuarioPut(
    req("/api/usuarios/2147000000", { method: "PUT", cookie, body: { nome: "Valid name" } }),
    ctx(2147000000),
  );
  assert.equal(res.status, 404);
});

test("REQ-USR-07: PUT with another user's email returns 409", async () => {
  const cookie = await cookieDe(await createUserDirectly(email("e409-admin"), "ADMIN"));
  const other = await createUserDirectly(email("e409-outro"));
  const target = await createUserDirectly(email("e409-alvo"));
  const res = await usuarioPut(
    req(`/api/usuarios/${target.id}`, { method: "PUT", cookie, body: { email: other.email } }),
    ctx(target.id),
  );
  assert.equal(res.status, 409);
});

test("REQ-USR-07: DELETE of a user that has a brand returns 409 and keeps the user", async () => {
  const cookie = await cookieDe(await createUserDirectly(email("fk-admin"), "ADMIN"));
  const owner = await createUserDirectly(email("fk-dono"), "MARCA");
  await prisma.marca.create({ data: { nome: `Brand FK ${owner.email}`, usuarioId: owner.id, status: "APROVADA" } });
  const res = await usuarioDelete(req(`/api/usuarios/${owner.id}`, { method: "DELETE", cookie }), ctx(owner.id));
  assert.equal(res.status, 409);
  assert.ok(await prisma.usuario.findUnique({ where: { id: owner.id } }));
});

test("REQ-AUTH-15: registration stores the email in lowercase and refuses the same email in another case", async () => {
  const lowercase = email("caixa");
  const mixed = lowercase.replace("caixa", "CaIxA").replace("@test.local", "@TEST.local");
  await prisma.usuario.deleteMany({ where: { email: lowercase } });
  const fresh = { nome: "Case User", senha: "Senha12345" };

  const first = await cadastrar(req("/api/users", { method: "POST", body: { ...fresh, email: mixed } }));
  assert.equal(first.status, 201);
  assert.ok(await prisma.usuario.findUnique({ where: { email: lowercase } }), "stored in lowercase");

  const repeated = await cadastrar(req("/api/users", { method: "POST", body: { ...fresh, email: lowercase } }));
  assert.equal(repeated.status, 409);
});

test("REQ-AUTH-15: a legacy account with a mixed-case email keeps signing in with any case", async () => {
  const legacy = email("legado").replace("legado", "LeGaDo");
  await prisma.usuario.deleteMany({ where: { email: legacy } });
  await prisma.usuario.create({
    data: { nome: "Legado", email: legacy, senha: await bcrypt.hash("Senha12345", 4), tipo: "CLIENTE" },
  });
  const res = await login(req("/api/auth", { method: "POST", body: { email: legacy.toLowerCase(), senha: "Senha12345" } }));
  assert.equal(res.status, 200);
});
