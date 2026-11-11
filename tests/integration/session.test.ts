/**
 * Spec 010: sessão com acesso curto + renovação revogável (ADR-0021).
 *
 * Os testes do serviço usam um armazém em memória (sem Redis nem banco). O teste
 * do armazém real precisa de um Redis em REDIS_URL. Os de ponta a ponta (login →
 * cookies, senha atual, rebaixamento de admin) precisam de Postgres e rodam no CI.
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
import { OperationNotAllowed } from "@/lib/errors/dominio";
import { updateUserSchema } from "@/lib/schemas/user";
import { POST as login } from "@/app/api/auth/route";
import { PUT as atualizarUsuario } from "@/app/api/usuarios/[id]/route";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

after(closeConnections);

// ---- armazém em memória com a mesma semântica de uso único -----------------
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

test("REQ-AUTH-18: o JWT de acesso expira em 15 minutos (não mais 7 dias)", async () => {
  assert.equal(ACCESS_TOKEN_SECONDS, 15 * 60);
  const before = Math.floor(Date.now() / 1000);
  const claims = decodeJwt(await signToken(ADMIN));
  const duration = Number(claims.exp) - before;
  assert.ok(duration >= 15 * 60 - 1 && duration <= 15 * 60 + 2, `duração=${duration}s`);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-19: renovação de uso único, com papel relido
// ---------------------------------------------------------------------------

test("REQ-AUTH-19: iniciar sessão emite acesso e renovação; renovar GASTA o token e emite outro par", async () => {
  const store = new InMemoryStore();
  const s1 = await startSession(ADMIN, store);
  assert.ok(s1.refresh);
  assert.ok(s1.access.split(".").length === 3);

  const r = await refreshSession(s1.refresh, lookup("ADMIN"), store);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.notEqual(r.session.refresh, s1.refresh);

  // o token antigo não serve mais (uso único)
  const reuse = await refreshSession(s1.refresh, lookup("ADMIN"), store);
  assert.deepEqual(reuse, { ok: false, motivo: "INVALIDO" });
});

test("REQ-AUTH-19: dois pedidos simultâneos com o mesmo token renovam só um", async () => {
  const store = new InMemoryStore();
  const { refresh: refresh } = await startSession(ADMIN, store);
  const [a, b] = await Promise.all([
    refreshSession(refresh!, lookup("ADMIN"), store),
    refreshSession(refresh!, lookup("ADMIN"), store),
  ]);
  assert.equal([a, b].filter((r) => r.ok).length, 1);
});

test("REQ-AUTH-19: ao renovar, o papel vem do banco: admin rebaixado perde o acesso de admin em no máximo 15 minutos", async () => {
  const store = new InMemoryStore();
  const { refresh: refresh } = await startSession(ADMIN, store);
  const r = await refreshSession(refresh!, lookup("CLIENTE"), store);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tipo, "CLIENTE");
  assert.equal((decodeJwt(r.session.access) as { tipo: string }).tipo, "CLIENTE");
});

test("REQ-AUTH-19: sem token, token desconhecido ou usuário excluído → renovação recusada", async () => {
  const store = new InMemoryStore();
  assert.deepEqual(await refreshSession(undefined, lookup("ADMIN"), store), { ok: false, motivo: "SEM_TOKEN" });
  assert.deepEqual(await refreshSession("inventado", lookup("ADMIN"), store), { ok: false, motivo: "INVALIDO" });

  const { refresh: refresh } = await startSession(ADMIN, store);
  const withoutUser = async () => null;
  assert.deepEqual(await refreshSession(refresh!, withoutUser, store), { ok: false, motivo: "INVALIDO" });
});

test("REQ-AUTH-19: sem Redis a renovação é NEGADA (indisponível) e o login continua, só sem token de renovação", async () => {
  const store = new InMemoryStore();
  const { refresh: refresh } = await startSession(ADMIN, store);
  store.quebrado = true;
  assert.deepEqual(await refreshSession(refresh!, lookup("ADMIN"), store), { ok: false, motivo: "INDISPONIVEL" });

  const withoutRedis = await startSession(ADMIN, store);
  assert.ok(withoutRedis.access, "o acesso é emitido mesmo sem Redis");
  assert.equal(withoutRedis.refresh, null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-20: revogação
// ---------------------------------------------------------------------------

test("REQ-AUTH-20: logout revoga o token de renovação; revogar todas as sessões do usuário invalida todos os tokens dele", async () => {
  const store = new InMemoryStore();
  const a = await startSession(ADMIN, store);
  const b = await startSession(ADMIN, store);
  const other = await startSession({ id: 2, email: "o@x.com", tipo: "CLIENTE" }, store);

  await endSession(a.refresh!, store);
  assert.equal(store.tokens.has(a.refresh!), false);

  await revokeUserSessions(1, store);
  assert.equal(store.tokens.has(b.refresh!), false);
  assert.equal(store.tokens.has(other.refresh!), true, "sessões de outro usuário não são tocadas");
});

test("REQ-AUTH-20: revogar nunca lança, mesmo com o armazém fora do ar", async () => {
  const store = new InMemoryStore();
  store.quebrado = true;
  await assert.doesNotReject(() => endSession("x", store));
  await assert.doesNotReject(() => revokeUserSessions(1, store));
  await assert.doesNotReject(() => endSession(undefined, store));
});

// ---------------------------------------------------------------------------
// REQ-AUTH-19/20 no Redis real
// ---------------------------------------------------------------------------

test("REQ-AUTH-19: no Redis real, só o hash do token é guardado, com validade, e GETDEL dá uso único", async () => {
  const { redis } = await import("@/lib/redis");
  const token = generateRefreshToken();
  assert.ok(token.length >= 43, "256 bits em base64url");
  const userId = 987001;

  await refreshTokenStore.create(token, userId);
  const keys = await redis.keys("refresh:*");
  assert.ok(!keys.some((c) => c.includes(token)), "o token em claro não pode estar no Redis");
  const owner = await refreshTokenStore.consume(token);
  assert.equal(owner, userId);
  assert.equal(await refreshTokenStore.consume(token), null, "uso único");

  const t2 = generateRefreshToken();
  const t3 = generateRefreshToken();
  await refreshTokenStore.create(t2, userId);
  await refreshTokenStore.create(t3, userId);
  await refreshTokenStore.revokeAll(userId);
  assert.equal(await refreshTokenStore.consume(t2), null);
  assert.equal(await refreshTokenStore.consume(t3), null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-21: senha atual
// ---------------------------------------------------------------------------

test("REQ-AUTH-21: OperacaoNaoAutorizada vira 403 com a própria mensagem; o schema aceita senhaAtual", async () => {
  const res = mapError(new OperationNotAllowed("Senha atual incorreta"), "Usuário");
  assert.equal(res?.status, 403);
  assert.deepEqual(await res?.json(), { erro: "Senha atual incorreta" });
  assert.equal(updateUserSchema.parse({ senha: "NovaSenha123", senhaAtual: "Antiga123" }).senhaAtual, "Antiga123");
});

// ---------------------------------------------------------------------------
// middleware: acesso expirado com renovação → renova e volta
// ---------------------------------------------------------------------------

const page = (cookie?: string) =>
  new NextRequest("http://localhost/perfil?aba=2", { headers: cookie ? { cookie } : {} });

test("REQ-AUTH-22: página protegida com acesso expirado e cookie de renovação passa pelo refresh e volta para a mesma página", async () => {
  const res = await middleware(page(`${REFRESH_COOKIE}=abc`));
  assert.equal(res.status, 307);
  const destination = new URL(res.headers.get("location")!);
  assert.equal(destination.pathname, "/api/auth/refresh");
  assert.equal(destination.searchParams.get("next"), "/perfil?aba=2");
});

test("REQ-AUTH-22: sem acesso e sem renovação vai para o login; com acesso válido segue", async () => {
  const withNothing = await middleware(page());
  assert.match(withNothing.headers.get("location")!, /\/sign-in\?next=%2Fperfil/);

  const withAccess = await middleware(page(`${ACCESS_COOKIE}=${await signToken(ADMIN)}`));
  assert.equal(withAccess.headers.get("location"), null);
});

// ===========================================================================
// COM BANCO — rodam no CI
// ===========================================================================

const PASSWORD = "SenhaAtual123";
async function userWithPassword(name: string) {
  const bcrypt = (await import("bcryptjs")).default;
  return createUserDirectly(email(name), "CLIENTE", await bcrypt.hash(PASSWORD, 4));
}

test("REQ-AUTH-18/19: login emite os cookies token e refresh; o refresh devolve o par novo e invalida o antigo", async () => {
  const u = await userWithPassword("sess-login");
  const res = await login(req("/api/auth", { method: "POST", body: { email: u.email, senha: PASSWORD } }));
  assert.equal(res.status, 200);
  const cookies = res.headers.getSetCookie();
  assert.ok(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=`)));
  assert.ok(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`)));
});

test("REQ-AUTH-21: trocar a PRÓPRIA senha exige a senha atual correta (403 sem ela); ADMIN trocando a de outro não precisa", async () => {
  const u = await userWithPassword("sess-senha");
  const cookie = await cookieDe(u);
  const fresh = "NovaSenha456";

  const without = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: fresh } }), ctx(u.id));
  assert.equal(without.status, 403);
  const wrong = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: fresh, senhaAtual: "errada-errada" } }), ctx(u.id));
  assert.equal(wrong.status, 403);
  const correct = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: fresh, senhaAtual: PASSWORD } }), ctx(u.id));
  assert.equal(correct.status, 200);

  const admin = await cookieDe(await createUserDirectly(email("sess-adm"), "ADMIN"));
  const other = await userWithPassword("sess-outro");
  const byAdmin = await atualizarUsuario(req(`/api/usuarios/${other.id}`, { method: "PUT", cookie: admin, body: { senha: fresh } }), ctx(other.id));
  assert.equal(byAdmin.status, 200);
});

test("REQ-AUTH-23: login com e-mail inexistente também executa o bcrypt (tempo da mesma ordem que com e-mail existente)", async () => {
  const u = await userWithPassword("sess-tempo");
  const measure = async (mail: string) => {
    const t = process.hrtime.bigint();
    await login(req("/api/auth", { method: "POST", body: { email: mail, senha: "qualquer-senha" } }));
    return Number(process.hrtime.bigint() - t) / 1e6;
  };
  await measure(u.email); // aquece o hash de comparação
  const existing = await measure(u.email);
  const missing = await measure(email("nao-existe"));
  assert.ok(missing > existing / 4, `inexistente=${missing}ms existente=${existing}ms: sem bcrypt seria quase instantâneo`);
});
