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
} from "@/lib/auth/constantes";
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
} from "@/services/sessao.service";
import { mapError } from "@/lib/http/responses";
import { OperacaoNaoAutorizada } from "@/lib/errors/dominio";
import { updateUserSchema } from "@/lib/schemas/usuario";
import { POST as login } from "@/app/api/auth/route";
import { PUT as atualizarUsuario } from "@/app/api/usuarios/[id]/route";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

after(closeConnections);

// ---- armazém em memória com a mesma semântica de uso único -----------------
class ArmazemEmMemoria implements RefreshTokenStore {
  readonly tokens = new Map<string, number>();
  quebrado = false;
  private falhar() {
    if (this.quebrado) throw new Error("Redis fora");
  }
  async create(token: string, userId: number) {
    this.falhar();
    this.tokens.set(token, userId);
  }
  async consume(token: string) {
    this.falhar();
    const dono = this.tokens.get(token) ?? null;
    this.tokens.delete(token);
    return dono;
  }
  async revoke(token: string) {
    await this.consume(token);
  }
  async revokeAll(userId: number) {
    this.falhar();
    for (const [t, id] of this.tokens) if (id === userId) this.tokens.delete(t);
  }
}

const ADMIN: SessionIdentity = { id: 1, email: "a@x.com", tipo: "ADMIN" };
const buscar = (type: SessionIdentity["tipo"]) => async (id: number) =>
  id === 1 ? { id, email: "a@x.com", tipo: type } : null;

process.env.JWT_SECRET ??= "teste-de-sessao-com-trinta-e-dois-caracteres";

// ---------------------------------------------------------------------------
// REQ-AUTH-18: acesso curto
// ---------------------------------------------------------------------------

test("REQ-AUTH-18: o JWT de acesso expira em 15 minutos (não mais 7 dias)", async () => {
  assert.equal(ACCESS_TOKEN_SECONDS, 15 * 60);
  const antes = Math.floor(Date.now() / 1000);
  const claims = decodeJwt(await signToken(ADMIN));
  const duracao = Number(claims.exp) - antes;
  assert.ok(duracao >= 15 * 60 - 1 && duracao <= 15 * 60 + 2, `duração=${duracao}s`);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-19: renovação de uso único, com papel relido
// ---------------------------------------------------------------------------

test("REQ-AUTH-19: iniciar sessão emite acesso e renovação; renovar GASTA o token e emite outro par", async () => {
  const armazem = new ArmazemEmMemoria();
  const s1 = await startSession(ADMIN, armazem);
  assert.ok(s1.refresh);
  assert.ok(s1.access.split(".").length === 3);

  const r = await refreshSession(s1.refresh, buscar("ADMIN"), armazem);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.notEqual(r.session.refresh, s1.refresh);

  // o token antigo não serve mais (uso único)
  const reuso = await refreshSession(s1.refresh, buscar("ADMIN"), armazem);
  assert.deepEqual(reuso, { ok: false, motivo: "INVALIDO" });
});

test("REQ-AUTH-19: dois pedidos simultâneos com o mesmo token renovam só um", async () => {
  const armazem = new ArmazemEmMemoria();
  const { refresh: refresh } = await startSession(ADMIN, armazem);
  const [a, b] = await Promise.all([
    refreshSession(refresh!, buscar("ADMIN"), armazem),
    refreshSession(refresh!, buscar("ADMIN"), armazem),
  ]);
  assert.equal([a, b].filter((r) => r.ok).length, 1);
});

test("REQ-AUTH-19: ao renovar, o papel vem do banco: admin rebaixado perde o acesso de admin em no máximo 15 minutos", async () => {
  const armazem = new ArmazemEmMemoria();
  const { refresh: refresh } = await startSession(ADMIN, armazem);
  const r = await refreshSession(refresh!, buscar("CLIENTE"), armazem);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tipo, "CLIENTE");
  assert.equal((decodeJwt(r.session.access) as { tipo: string }).tipo, "CLIENTE");
});

test("REQ-AUTH-19: sem token, token desconhecido ou usuário excluído → renovação recusada", async () => {
  const armazem = new ArmazemEmMemoria();
  assert.deepEqual(await refreshSession(undefined, buscar("ADMIN"), armazem), { ok: false, motivo: "SEM_TOKEN" });
  assert.deepEqual(await refreshSession("inventado", buscar("ADMIN"), armazem), { ok: false, motivo: "INVALIDO" });

  const { refresh: refresh } = await startSession(ADMIN, armazem);
  const semUsuario = async () => null;
  assert.deepEqual(await refreshSession(refresh!, semUsuario, armazem), { ok: false, motivo: "INVALIDO" });
});

test("REQ-AUTH-19: sem Redis a renovação é NEGADA (indisponível) e o login continua, só sem token de renovação", async () => {
  const armazem = new ArmazemEmMemoria();
  const { refresh: refresh } = await startSession(ADMIN, armazem);
  armazem.quebrado = true;
  assert.deepEqual(await refreshSession(refresh!, buscar("ADMIN"), armazem), { ok: false, motivo: "INDISPONIVEL" });

  const semRedis = await startSession(ADMIN, armazem);
  assert.ok(semRedis.access, "o acesso é emitido mesmo sem Redis");
  assert.equal(semRedis.refresh, null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-20: revogação
// ---------------------------------------------------------------------------

test("REQ-AUTH-20: logout revoga o token de renovação; revogar todas as sessões do usuário invalida todos os tokens dele", async () => {
  const armazem = new ArmazemEmMemoria();
  const a = await startSession(ADMIN, armazem);
  const b = await startSession(ADMIN, armazem);
  const outro = await startSession({ id: 2, email: "o@x.com", tipo: "CLIENTE" }, armazem);

  await endSession(a.refresh!, armazem);
  assert.equal(armazem.tokens.has(a.refresh!), false);

  await revokeUserSessions(1, armazem);
  assert.equal(armazem.tokens.has(b.refresh!), false);
  assert.equal(armazem.tokens.has(outro.refresh!), true, "sessões de outro usuário não são tocadas");
});

test("REQ-AUTH-20: revogar nunca lança, mesmo com o armazém fora do ar", async () => {
  const armazem = new ArmazemEmMemoria();
  armazem.quebrado = true;
  await assert.doesNotReject(() => endSession("x", armazem));
  await assert.doesNotReject(() => revokeUserSessions(1, armazem));
  await assert.doesNotReject(() => endSession(undefined, armazem));
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
  const dono = await refreshTokenStore.consume(token);
  assert.equal(dono, userId);
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
  const res = mapError(new OperacaoNaoAutorizada("Senha atual incorreta"), "Usuário");
  assert.equal(res?.status, 403);
  assert.deepEqual(await res?.json(), { erro: "Senha atual incorreta" });
  assert.equal(updateUserSchema.parse({ senha: "NovaSenha123", senhaAtual: "Antiga123" }).senhaAtual, "Antiga123");
});

// ---------------------------------------------------------------------------
// middleware: acesso expirado com renovação → renova e volta
// ---------------------------------------------------------------------------

const pagina = (cookie?: string) =>
  new NextRequest("http://localhost/perfil?aba=2", { headers: cookie ? { cookie } : {} });

test("REQ-AUTH-22: página protegida com acesso expirado e cookie de renovação passa pelo refresh e volta para a mesma página", async () => {
  const res = await middleware(pagina(`${REFRESH_COOKIE}=abc`));
  assert.equal(res.status, 307);
  const destino = new URL(res.headers.get("location")!);
  assert.equal(destino.pathname, "/api/auth/refresh");
  assert.equal(destino.searchParams.get("next"), "/perfil?aba=2");
});

test("REQ-AUTH-22: sem acesso e sem renovação vai para o login; com acesso válido segue", async () => {
  const semNada = await middleware(pagina());
  assert.match(semNada.headers.get("location")!, /\/sign-in\?next=%2Fperfil/);

  const comAcesso = await middleware(pagina(`${ACCESS_COOKIE}=${await signToken(ADMIN)}`));
  assert.equal(comAcesso.headers.get("location"), null);
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
  const nova = "NovaSenha456";

  const sem = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: nova } }), ctx(u.id));
  assert.equal(sem.status, 403);
  const errada = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: nova, senhaAtual: "errada-errada" } }), ctx(u.id));
  assert.equal(errada.status, 403);
  const certa = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: nova, senhaAtual: PASSWORD } }), ctx(u.id));
  assert.equal(certa.status, 200);

  const admin = await cookieDe(await createUserDirectly(email("sess-adm"), "ADMIN"));
  const outro = await userWithPassword("sess-outro");
  const porAdmin = await atualizarUsuario(req(`/api/usuarios/${outro.id}`, { method: "PUT", cookie: admin, body: { senha: nova } }), ctx(outro.id));
  assert.equal(porAdmin.status, 200);
});

test("REQ-AUTH-23: login com e-mail inexistente também executa o bcrypt (tempo da mesma ordem que com e-mail existente)", async () => {
  const u = await userWithPassword("sess-tempo");
  const medir = async (mail: string) => {
    const t = process.hrtime.bigint();
    await login(req("/api/auth", { method: "POST", body: { email: mail, senha: "qualquer-senha" } }));
    return Number(process.hrtime.bigint() - t) / 1e6;
  };
  await medir(u.email); // aquece o hash de comparação
  const existente = await medir(u.email);
  const inexistente = await medir(email("nao-existe"));
  assert.ok(inexistente > existente / 4, `inexistente=${inexistente}ms existente=${existente}ms: sem bcrypt seria quase instantâneo`);
});
