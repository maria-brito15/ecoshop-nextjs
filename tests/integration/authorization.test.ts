// Capacidade AUTZ — docs/capabilities/autorizacao/spec.md  (ADR-0017)
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
import {
  POST as criarCategoria,
  GET as listarCategorias,
} from "@/app/api/categorias/route";
import { DELETE as deletarProduto } from "@/app/api/produtos/[id]/route";
import {
  POST as criarProduto,
  GET as listarProdutos,
} from "@/app/api/produtos/route";
import { POST as criarMarca } from "@/app/api/marcas/route";
import { POST as criarCertificado } from "@/app/api/certificados/route";
import { POST as uploadFoto } from "@/app/api/produtos/[id]/fotos/route";
import { GET as listarUsuarios } from "@/app/api/usuarios/route";
import {
  GET as buscarUsuario,
  PUT as atualizarUsuario,
  DELETE as excluirUsuario,
} from "@/app/api/usuarios/[id]/route";
import { POST as scan } from "@/app/api/ia/scan/route";
import { POST as chat } from "@/app/api/ia/chat/route";
import fs from "node:fs";
import path from "node:path";

after(closeConnections);

test("REQ-AUTZ-01: writing to the catalog requires ADMIN (401 without login, 403 for CLIENTE)", async () => {
  const client = await createUserDirectly(email("authz01"), "CLIENTE");
  const cookie = await cookieDe(client);
  const routes: [
    string,
    (r: ReturnType<typeof req>) => Promise<Response>,
    string,
    unknown,
  ][] = [
    ["categorias", criarCategoria, "POST", { nome: "x" }],
    ["marcas", criarMarca, "POST", { nome: "x", usuarioId: 1 }],
    [
      "certificados",
      criarCertificado,
      "POST",
      { nome: "x", orgaoEmissor: "y" },
    ],
    [
      "produtos",
      criarProduto,
      "POST",
      { nome: "x", preco: 1, categoriaId: 1, marcaId: 1 },
    ],
  ];
  for (const [name, handler, method, body] of routes) {
    assert.equal(
      (await handler(req(`/api/${name}`, { method, body }))).status,
      401,
      `${name} without login`,
    );
    assert.equal(
      (await handler(req(`/api/${name}`, { method, cookie, body }))).status,
      403,
      `${name} CLIENTE`,
    );
  }
  const del = (c?: string) =>
    deletarProduto(
      req("/api/produtos/1", { method: "DELETE", cookie: c }),
      ctx(1),
    );
  assert.equal((await del()).status, 401);
  assert.equal((await del(cookie)).status, 403);
  const photo = (c?: string) =>
    uploadFoto(
      req("/api/produtos/1/fotos", {
        method: "POST",
        cookie: c,
        form: new FormData(),
      }),
      ctx(1),
    );
  assert.equal((await photo()).status, 401);
  assert.equal((await photo(cookie)).status, 403);
});

test("REQ-AUTZ-02: reading the catalog (products and categories) is public", async () => {
  assert.equal((await listarProdutos(req("/api/produtos"))).status, 200);
  assert.equal((await listarCategorias()).status, 200);
});

test("REQ-AUTZ-03: AI scan and chat require an authenticated user", async () => {
  assert.equal(
    (await scan(req("/api/ia/scan", { method: "POST", form: new FormData() })))
      .status,
    401,
  );
  assert.equal(
    (
      await chat(
        req("/api/ia/chat", { method: "POST", body: { mensagem: "oi" } }),
      )
    ).status,
    401,
  );
});

test("REQ-AUTZ-04: listing and creating users is ADMIN-only", async () => {
  const client = await createUserDirectly(email("authz04"), "CLIENTE");
  assert.equal((await listarUsuarios(req("/api/usuarios"))).status, 401);
  assert.equal(
    (
      await listarUsuarios(
        req("/api/usuarios", { cookie: await cookieDe(client) }),
      )
    ).status,
    403,
  );
});

test("REQ-AUTZ-05: /api/usuarios/[id]: the user themselves or ADMIN; deleting is ADMIN-only", async () => {
  const a = await createUserDirectly(email("authz05a"), "CLIENTE");
  const b = await createUserDirectly(email("authz05b"), "CLIENTE");
  const admin = await createUserDirectly(email("authz05admin"), "ADMIN");
  const ca = await cookieDe(a);
  assert.equal(
    (
      await buscarUsuario(
        req(`/api/usuarios/${a.id}`, { cookie: ca }),
        ctx(a.id),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await buscarUsuario(
        req(`/api/usuarios/${b.id}`, { cookie: ca }),
        ctx(b.id),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await buscarUsuario(
        req(`/api/usuarios/${a.id}`, { cookie: await cookieDe(admin) }),
        ctx(a.id),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await atualizarUsuario(
        req(`/api/usuarios/${b.id}`, {
          method: "PUT",
          cookie: ca,
          body: { nome: "Invasor Teste" },
        }),
        ctx(b.id),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await excluirUsuario(
        req(`/api/usuarios/${a.id}`, { method: "DELETE", cookie: ca }),
        ctx(a.id),
      )
    ).status,
    403,
  );
});

/**
 * REQ-AUTZ-07: "deny by default" as a regression guard.
 *
 * There is no central per-route policy table (ADR-0017 deliberately decided
 * that authorization lives in the handler, not in the middleware).
 * This test makes up for the missing central table by doing the equivalent
 * through static analysis: it walks every `app/api/**\/route.ts`, finds each
 * exported handler (GET/POST/PUT/DELETE/PATCH) and fails if the handler does not call
 * `requireAuth`/`requireAdmin`/`getSession` AND is not in the explicit list of
 * public routes below. A new route with neither breaks this test — it does
 * not become public "by accident".
 */
test("REQ-AUTZ-07: every API route declares its access policy (explicit authentication, or public on the allowlist)", () => {
  const API_DIR = path.join(process.cwd(), "app", "api");

  // Intentionally public routes (catalog reads, login, registration,
  // logout e health-check). Qualquer outra precisa chamar um guard.
  const PUBLIC_ROUTES = new Set([
    "health/route.ts:GET",
    "auth/route.ts:POST",
    "auth/route.ts:DELETE",
    "users/route.ts:POST",
    "categorias/route.ts:GET",
    "categorias/[id]/route.ts:GET",
    "certificados/route.ts:GET",
    "certificados/[id]/route.ts:GET",
    "marcas/route.ts:GET",
    "marcas/[id]/route.ts:GET",
    "produtos/route.ts:GET",
    "produtos/[id]/route.ts:GET",
    "produtos/[id]/fotos/route.ts:GET",
  ]);

  const GUARDS = ["requireAuth(", "requireAdmin(", "getSession("];
  const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  function listFilesRoute(dir: string): string[] {
    const result: string[] = [];
    for (const name of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, name);
      if (fs.statSync(fullPath).isDirectory()) {
        result.push(...listFilesRoute(fullPath));
      } else if (name === "route.ts") {
        result.push(fullPath);
      }
    }
    return result;
  }

  /** Extracts the body (between balanced braces) of a function from the index of its opening "{". */
  function bodyFrom(source: string, openBraceIndex: number): string {
    let depth = 0;
    for (let i = openBraceIndex; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}") {
        depth--;
        if (depth === 0) return source.slice(openBraceIndex, i + 1);
      }
    }
    return source.slice(openBraceIndex);
  }

  /**
   * Finds the "{" that opens the function BODY (not that of a parameter
   * destructuring, e.g. `{ params }: { params: Promise<{ id: string }> }`).
   * Counts parentheses from the first "(" after the function name to its
   * closing, and only then looks for the next "{" — that is the real body.
   */
  function handlerBody(source: string, functionNameIndex: number): string {
    const openParen = source.indexOf("(", functionNameIndex);
    let depth = 0;
    let i = openParen;
    for (; i < source.length; i++) {
      if (source[i] === "(") depth++;
      if (source[i] === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    const openBrace = source.indexOf("{", i);
    return bodyFrom(source, openBrace);
  }

  const withoutPolicy: string[] = [];

  for (const file of listFilesRoute(API_DIR)) {
    const source = fs.readFileSync(file, "utf8");
    const fileKey = path
      .relative(API_DIR, file)
      .split(path.sep)
      .join("/");

    for (const method of METHODS) {
      const re = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`);
      const m = re.exec(source);
      if (!m) continue;

      const key = `${fileKey}:${method}`;
      if (PUBLIC_ROUTES.has(key)) continue;

      const body = handlerBody(source, m.index);
      const declaresGuard = GUARDS.some((g) => body.includes(g));
      if (!declaresGuard) withoutPolicy.push(key);
    }
  }

  assert.deepEqual(
    withoutPolicy,
    [],
    `API route(s) without a declared access policy (neither a guard nor on the public allowlist): ${withoutPolicy.join(", ")}`,
  );
});
