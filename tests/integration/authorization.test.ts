// AUTZ capability — docs/capabilities/authorization/spec.md  (ADR-0017)
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
import {
  POST as createCategory,
  GET as listCategories,
} from "@/app/api/categories/route";
import { DELETE as deleteProduct } from "@/app/api/products/[id]/route";
import {
  POST as createProduct,
  GET as listProducts,
} from "@/app/api/products/route";
import { POST as createBrand } from "@/app/api/brands/route";
import { POST as createCertificate } from "@/app/api/certificates/route";
import { POST as uploadPhoto } from "@/app/api/products/[id]/photos/route";
import { GET as listUsers, POST as createUser } from "@/app/api/users/route";
import {
  GET as getUser,
  PUT as updateUser,
  DELETE as deleteUser,
} from "@/app/api/users/[id]/route";
import { POST as scan } from "@/app/api/ai/scan/route";
import { POST as chat } from "@/app/api/ai/chat/route";
import fs from "node:fs";
import path from "node:path";

after(closeConnections);

test("REQ-AUTZ-01: writing to the catalog requires ADMIN (401 without login, 403 for CUSTOMER)", async () => {
  const client = await createUserDirectly(email("authz01"), "CUSTOMER");
  const cookie = await cookieFor(client);
  const routes: [
    string,
    (r: ReturnType<typeof req>) => Promise<Response>,
    string,
    unknown,
  ][] = [
    ["categories", createCategory, "POST", { name: "x" }],
    ["brands", createBrand, "POST", { name: "x", userId: 1 }],
    [
      "certificates",
      createCertificate,
      "POST",
      { name: "x", issuingBody: "y" },
    ],
    [
      "products",
      createProduct,
      "POST",
      { name: "x", price: 1, categoryId: 1, brandId: 1 },
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
      `${name} CUSTOMER`,
    );
  }
  const del = (c?: string) =>
    deleteProduct(
      req("/api/products/1", { method: "DELETE", cookie: c }),
      ctx(1),
    );
  assert.equal((await del()).status, 401);
  assert.equal((await del(cookie)).status, 403);
  const photo = (c?: string) =>
    uploadPhoto(
      req("/api/products/1/photos", {
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
  assert.equal((await listProducts(req("/api/products"))).status, 200);
  assert.equal((await listCategories()).status, 200);
});

test("REQ-AUTZ-03: AI scan and chat require an authenticated user", async () => {
  assert.equal(
    (await scan(req("/api/ai/scan", { method: "POST", form: new FormData() })))
      .status,
    401,
  );
  assert.equal(
    (
      await chat(
        req("/api/ai/chat", { method: "POST", body: { message: "hi" } }),
      )
    ).status,
    401,
  );
});

test("REQ-AUTZ-04: listing users is ADMIN-only; creating an ADMIN-type user needs an ADMIN session", async () => {
  const client = await createUserDirectly(email("authz04"), "CUSTOMER");
  const admin = await createUserDirectly(email("authz04admin"), "ADMIN");
  assert.equal((await listUsers(req("/api/users"))).status, 401);
  assert.equal(
    (
      await listUsers(
        req("/api/users", { cookie: await cookieFor(client) }),
      )
    ).status,
    403,
  );

  const adminBody = () => ({
    name: "Created Admin",
    email: email("authz04new"),
    password: "Password12345",
    type: "ADMIN",
  });
  // Anonymous and CUSTOMER callers get the public registration, which refuses the ADMIN type.
  assert.equal(
    (await createUser(req("/api/users", { method: "POST", body: adminBody() }))).status,
    400,
  );
  assert.equal(
    (
      await createUser(
        req("/api/users", { method: "POST", cookie: await cookieFor(client), body: adminBody() }),
      )
    ).status,
    400,
  );
  // An ADMIN session takes the administrative path: any type, 201.
  const created = await createUser(
    req("/api/users", { method: "POST", cookie: await cookieFor(admin), body: adminBody() }),
  );
  assert.equal(created.status, 201);
  assert.equal((await created.json()).user.type, "ADMIN");
});

test("REQ-AUTZ-05: /api/users/[id]: the user themselves or ADMIN; deleting is ADMIN-only", async () => {
  const a = await createUserDirectly(email("authz05a"), "CUSTOMER");
  const b = await createUserDirectly(email("authz05b"), "CUSTOMER");
  const admin = await createUserDirectly(email("authz05admin"), "ADMIN");
  const ca = await cookieFor(a);
  assert.equal(
    (
      await getUser(
        req(`/api/users/${a.id}`, { cookie: ca }),
        ctx(a.id),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await getUser(
        req(`/api/users/${b.id}`, { cookie: ca }),
        ctx(b.id),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await getUser(
        req(`/api/users/${a.id}`, { cookie: await cookieFor(admin) }),
        ctx(a.id),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await updateUser(
        req(`/api/users/${b.id}`, {
          method: "PUT",
          cookie: ca,
          body: { name: "Test Intruder" },
        }),
        ctx(b.id),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await deleteUser(
        req(`/api/users/${a.id}`, { method: "DELETE", cookie: ca }),
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
  // logout, health check and session renewal). Any other route must call a guard.
  const PUBLIC_ROUTES = new Set([
    "health/route.ts:GET",
    "auth/route.ts:POST",
    "auth/route.ts:DELETE",
    // Redirecting renewal: authenticated by the single-use refresh cookie (ADR-0021), not a session guard.
    "auth/refresh/route.ts:GET",
    "users/route.ts:POST",
    "categories/route.ts:GET",
    "categories/[id]/route.ts:GET",
    "certificates/route.ts:GET",
    "certificates/[id]/route.ts:GET",
    "brands/route.ts:GET",
    "brands/[id]/route.ts:GET",
    "products/route.ts:GET",
    "products/[id]/route.ts:GET",
    "products/[id]/photos/route.ts:GET",
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
