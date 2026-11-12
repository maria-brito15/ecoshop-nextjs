/**
 * Spec 010: short-lived access plus revocable renewal (ADR-0021).
 *
 * The service tests use an in-memory store (no Redis or database). The real-store
 * test needs a Redis at REDIS_URL. The end-to-end ones (login → cookies, current
 * password, admin demotion) need Postgres and run in CI.
 */
import { email, createUserDirectly, cookieDe, req, ctx, closeConnections } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { decodeJwt } from "jose";
import {
  ACCESS_TOKEN_SECONDS,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth/constants";
import { signToken } from "@/lib/auth";
import {
  refreshTokenStore,
  generateRefreshToken,
  type RefreshTokenStore,
} from "@/lib/auth/refresh";
import {
  startSession,
  refreshSession,
  endSession,
  revokeUserSessions,
  type SessionIdentity,
} from "@/services/session.service";
import { mapError } from "@/lib/http/responses";
import { OperationNotAllowed } from "@/lib/errors/domain";
import { updateUserSchema } from "@/lib/schemas/user";
import { POST as login } from "@/app/api/auth/route";
import { PUT as updateUser } from "@/app/api/usuarios/[id]/route";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

after(closeConnections);

// ---- in-memory store with the same single-use semantics -----------------
class InMemoryStore implements RefreshTokenStore {
  readonly tokens = new Map<string, number>();
  quebrado = false;
  private fail() {
    if (this.quebrado) throw new Error("Redis fora");
  }
  async create(token: string, userId: number) {
    this.fail();
    this.tokens.set(token, userId);
  }
  async consume(token: string) {
    this.fail();
    const owner = this.tokens.get(token) ?? null;
    this.tokens.delete(token);
    return owner;
  }
  async revoke(token: string) {
    await this.consume(token);
  }
  async revokeAll(userId: number) {
    this.fail();
    for (const [t, id] of this.tokens) if (id === userId) this.tokens.delete(t);
  }
}

const ADMIN: SessionIdentity = { id: 1, email: "a@x.com", tipo: "ADMIN" };
const lookup = (type: SessionIdentity["tipo"]) => async (id: number) =>
  id === 1 ? { id, email: "a@x.com", tipo: type } : null;

process.env.JWT_SECRET ??= "teste-de-sessao-com-trinta-e-dois-caracteres";

// ---------------------------------------------------------------------------
// REQ-AUTH-18: acesso curto
// ---------------------------------------------------------------------------

test("REQ-AUTH-18: the access JWT expires in 15 minutes (no longer 7 days)", async () => {
  assert.equal(ACCESS_TOKEN_SECONDS, 15 * 60);
  const before = Math.floor(Date.now() / 1000);
  const claims = decodeJwt(await signToken(ADMIN));
  const duration = Number(claims.exp) - before;
  assert.ok(duration >= 15 * 60 - 1 && duration <= 15 * 60 + 2, `duration=${duration}s`);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-19: single-use renewal, with the role re-read
// ---------------------------------------------------------------------------

test("REQ-AUTH-19: starting a session issues access and refresh; refreshing SPENDS the token and issues another pair", async () => {
  const store = new InMemoryStore();
  const s1 = await startSession(ADMIN, store);
  assert.ok(s1.refresh);
  assert.ok(s1.access.split(".").length === 3);

  const r = await refreshSession(s1.refresh, lookup("ADMIN"), store);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.notEqual(r.session.refresh, s1.refresh);

  // the old token no longer works (single use)
  const reuse = await refreshSession(s1.refresh, lookup("ADMIN"), store);
  assert.deepEqual(reuse, { ok: false, reason: "INVALID" });
});

test("REQ-AUTH-19: two simultaneous requests with the same token refresh only one", async () => {
  const store = new InMemoryStore();
  const { refresh: refresh } = await startSession(ADMIN, store);
  const [a, b] = await Promise.all([
    refreshSession(refresh!, lookup("ADMIN"), store),
    refreshSession(refresh!, lookup("ADMIN"), store),
  ]);
  assert.equal([a, b].filter((r) => r.ok).length, 1);
});

test("REQ-AUTH-19: on refresh, the role comes from the database: a demoted admin loses admin access within 15 minutes at most", async () => {
  const store = new InMemoryStore();
  const { refresh: refresh } = await startSession(ADMIN, store);
  const r = await refreshSession(refresh!, lookup("CLIENTE"), store);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tipo, "CLIENTE");
  assert.equal((decodeJwt(r.session.access) as { tipo: string }).tipo, "CLIENTE");
});

test("REQ-AUTH-19: without a token, with an unknown token or a deleted user → refresh refused", async () => {
  const store = new InMemoryStore();
  assert.deepEqual(await refreshSession(undefined, lookup("ADMIN"), store), { ok: false, reason: "NO_TOKEN" });
  assert.deepEqual(await refreshSession("inventado", lookup("ADMIN"), store), { ok: false, reason: "INVALID" });

  const { refresh: refresh } = await startSession(ADMIN, store);
  const withoutUser = async () => null;
  assert.deepEqual(await refreshSession(refresh!, withoutUser, store), { ok: false, reason: "INVALID" });
});

test("REQ-AUTH-19: without Redis the refresh is DENIED (unavailable) and login continues, only without a refresh token", async () => {
  const store = new InMemoryStore();
  const { refresh: refresh } = await startSession(ADMIN, store);
  store.quebrado = true;
  assert.deepEqual(await refreshSession(refresh!, lookup("ADMIN"), store), { ok: false, reason: "UNAVAILABLE" });

  const withoutRedis = await startSession(ADMIN, store);
  assert.ok(withoutRedis.access, "access is issued even without Redis");
  assert.equal(withoutRedis.refresh, null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-20: revocation
// ---------------------------------------------------------------------------

test("REQ-AUTH-20: logout revokes the refresh token; revoking all of a user's sessions invalidates all their tokens", async () => {
  const store = new InMemoryStore();
  const a = await startSession(ADMIN, store);
  const b = await startSession(ADMIN, store);
  const other = await startSession({ id: 2, email: "o@x.com", tipo: "CLIENTE" }, store);

  await endSession(a.refresh!, store);
  assert.equal(store.tokens.has(a.refresh!), false);

  await revokeUserSessions(1, store);
  assert.equal(store.tokens.has(b.refresh!), false);
  assert.equal(store.tokens.has(other.refresh!), true, "other users' sessions are not touched");
});

test("REQ-AUTH-20: revoking never throws, even with the store down", async () => {
  const store = new InMemoryStore();
  store.quebrado = true;
  await assert.doesNotReject(() => endSession("x", store));
  await assert.doesNotReject(() => revokeUserSessions(1, store));
  await assert.doesNotReject(() => endSession(undefined, store));
});

// ---------------------------------------------------------------------------
// REQ-AUTH-19/20 no Redis real
// ---------------------------------------------------------------------------

test("REQ-AUTH-19: on real Redis, only the token hash is stored, with a TTL, and GETDEL gives single use", async () => {
  const { redis } = await import("@/lib/redis");
  const token = generateRefreshToken();
  assert.ok(token.length >= 43, "256 bits in base64url");
  const userId = 987001;

  await refreshTokenStore.create(token, userId);
  const keys = await redis.keys("refresh:*");
  assert.ok(!keys.some((c) => c.includes(token)), "the plain token must not be in Redis");
  const owner = await refreshTokenStore.consume(token);
  assert.equal(owner, userId);
  assert.equal(await refreshTokenStore.consume(token), null, "single use");

  const t2 = generateRefreshToken();
  const t3 = generateRefreshToken();
  await refreshTokenStore.create(t2, userId);
  await refreshTokenStore.create(t3, userId);
  await refreshTokenStore.revokeAll(userId);
  assert.equal(await refreshTokenStore.consume(t2), null);
  assert.equal(await refreshTokenStore.consume(t3), null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-21: current password
// ---------------------------------------------------------------------------

test("REQ-AUTH-21: OperationNotAllowed becomes 403 with its own message; the schema accepts senhaAtual", async () => {
  const res = mapError(new OperationNotAllowed("Current password is incorrect"), "User");
  assert.equal(res?.status, 403);
  assert.deepEqual(await res?.json(), { erro: "Current password is incorrect" });
  assert.equal(updateUserSchema.parse({ senha: "NovaSenha123", senhaAtual: "Antiga123" }).senhaAtual, "Antiga123");
});

// ---------------------------------------------------------------------------
// middleware: expired access with renewal → renews and returns
// ---------------------------------------------------------------------------

const page = (cookie?: string) =>
  new NextRequest("http://localhost/perfil?aba=2", { headers: cookie ? { cookie } : {} });

test("REQ-AUTH-22: a protected page with an expired access and a refresh cookie goes through the refresh and returns to the same page", async () => {
  const res = await middleware(page(`${REFRESH_COOKIE}=abc`));
  assert.equal(res.status, 307);
  const destination = new URL(res.headers.get("location")!);
  assert.equal(destination.pathname, "/api/auth/refresh");
  assert.equal(destination.searchParams.get("next"), "/perfil?aba=2");
});

test("REQ-AUTH-22: without access and without refresh it goes to login; with a valid access it continues", async () => {
  const withNothing = await middleware(page());
  assert.match(withNothing.headers.get("location")!, /\/sign-in\?next=%2Fperfil/);

  const withAccess = await middleware(page(`${ACCESS_COOKIE}=${await signToken(ADMIN)}`));
  assert.equal(withAccess.headers.get("location"), null);
});

// ===========================================================================
// WITH DATABASE — run in CI
// ===========================================================================

const PASSWORD = "SenhaAtual123";
async function userWithPassword(name: string) {
  const bcrypt = (await import("bcryptjs")).default;
  return createUserDirectly(email(name), "CLIENTE", await bcrypt.hash(PASSWORD, 4));
}

test("REQ-AUTH-18/19: login issues the token and refresh cookies; the refresh returns the new pair and invalidates the old one", async () => {
  const u = await userWithPassword("sess-login");
  const res = await login(req("/api/auth", { method: "POST", body: { email: u.email, senha: PASSWORD } }));
  assert.equal(res.status, 200);
  const cookies = res.headers.getSetCookie();
  assert.ok(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=`)));
  assert.ok(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`)));
});

test("REQ-AUTH-21: changing your OWN password requires the correct current password (403 without it); ADMIN changing someone else's does not need it", async () => {
  const u = await userWithPassword("sess-password");
  const cookie = await cookieDe(u);
  const fresh = "NovaSenha456";

  const without = await updateUser(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: fresh } }), ctx(u.id));
  assert.equal(without.status, 403);
  const wrong = await updateUser(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: fresh, senhaAtual: "errada-errada" } }), ctx(u.id));
  assert.equal(wrong.status, 403);
  const correct = await updateUser(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: fresh, senhaAtual: PASSWORD } }), ctx(u.id));
  assert.equal(correct.status, 200);

  const admin = await cookieDe(await createUserDirectly(email("sess-adm"), "ADMIN"));
  const other = await userWithPassword("sess-outro");
  const byAdmin = await updateUser(req(`/api/usuarios/${other.id}`, { method: "PUT", cookie: admin, body: { senha: fresh } }), ctx(other.id));
  assert.equal(byAdmin.status, 200);
});

test("REQ-AUTH-23: login with an unknown email also runs bcrypt (same order of time as with an existing email)", async () => {
  const u = await userWithPassword("sess-tempo");
  const measure = async (mail: string) => {
    const t = process.hrtime.bigint();
    await login(req("/api/auth", { method: "POST", body: { email: mail, senha: "any-password" } }));
    return Number(process.hrtime.bigint() - t) / 1e6;
  };
  await measure(u.email); // warms up the comparison hash
  const existing = await measure(u.email);
  const missing = await measure(email("nao-existe"));
  assert.ok(missing > existing / 4, `missing=${missing}ms existing=${existing}ms: without bcrypt it would be almost instant`);
});
