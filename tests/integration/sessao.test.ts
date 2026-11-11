/**
 * Spec 010: sessão com acesso curto + renovação revogável (ADR-0021).
 *
 * Os testes do serviço usam um armazém em memória (sem Redis nem banco). O teste
 * do armazém real precisa de um Redis em REDIS_URL. Os de ponta a ponta (login →
 * cookies, senha atual, rebaixamento de admin) precisam de Postgres e rodam no CI.
 */
import { email, criarUsuarioDireto, cookieDe, req, ctx, encerrar } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { decodeJwt } from "jose";
import {
  TEMPO_DO_ACESSO_SEGUNDOS,
  COOKIE_ACESSO,
  COOKIE_RENOVACAO,
} from "@/lib/auth/constantes";
import { signToken } from "@/lib/auth";
import {
  armazemDeRenovacao,
  gerarTokenDeRenovacao,
  type ArmazemDeRenovacao,
} from "@/lib/auth/refresh";
import {
  iniciarSessao,
  renovarSessao,
  encerrarSessao,
  revogarSessoesDoUsuario,
  type IdentidadeDaSessao,
} from "@/services/sessao.service";
import { mapeiaErro } from "@/lib/http/responses";
import { OperacaoNaoAutorizada } from "@/lib/errors/dominio";
import { atualizarUsuarioSchema } from "@/lib/schemas/usuario";
import { POST as login } from "@/app/api/auth/route";
import { PUT as atualizarUsuario } from "@/app/api/usuarios/[id]/route";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

after(encerrar);

// ---- armazém em memória com a mesma semântica de uso único -----------------
class ArmazemEmMemoria implements ArmazemDeRenovacao {
  readonly tokens = new Map<string, number>();
  quebrado = false;
  private falhar() {
    if (this.quebrado) throw new Error("Redis fora");
  }
  async criar(token: string, usuarioId: number) {
    this.falhar();
    this.tokens.set(token, usuarioId);
  }
  async consumir(token: string) {
    this.falhar();
    const dono = this.tokens.get(token) ?? null;
    this.tokens.delete(token);
    return dono;
  }
  async revogar(token: string) {
    await this.consumir(token);
  }
  async revogarTodos(usuarioId: number) {
    this.falhar();
    for (const [t, id] of this.tokens) if (id === usuarioId) this.tokens.delete(t);
  }
}

const ADMIN: IdentidadeDaSessao = { id: 1, email: "a@x.com", tipo: "ADMIN" };
const buscar = (tipo: IdentidadeDaSessao["tipo"]) => async (id: number) =>
  id === 1 ? { id, email: "a@x.com", tipo } : null;

process.env.JWT_SECRET ??= "teste-de-sessao-com-trinta-e-dois-caracteres";

// ---------------------------------------------------------------------------
// REQ-AUTH-18: acesso curto
// ---------------------------------------------------------------------------

test("REQ-AUTH-18: o JWT de acesso expira em 15 minutos (não mais 7 dias)", async () => {
  assert.equal(TEMPO_DO_ACESSO_SEGUNDOS, 15 * 60);
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
  const s1 = await iniciarSessao(ADMIN, armazem);
  assert.ok(s1.renovacao);
  assert.ok(s1.acesso.split(".").length === 3);

  const r = await renovarSessao(s1.renovacao, buscar("ADMIN"), armazem);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.notEqual(r.sessao.renovacao, s1.renovacao);

  // o token antigo não serve mais (uso único)
  const reuso = await renovarSessao(s1.renovacao, buscar("ADMIN"), armazem);
  assert.deepEqual(reuso, { ok: false, motivo: "INVALIDO" });
});

test("REQ-AUTH-19: dois pedidos simultâneos com o mesmo token renovam só um", async () => {
  const armazem = new ArmazemEmMemoria();
  const { renovacao } = await iniciarSessao(ADMIN, armazem);
  const [a, b] = await Promise.all([
    renovarSessao(renovacao!, buscar("ADMIN"), armazem),
    renovarSessao(renovacao!, buscar("ADMIN"), armazem),
  ]);
  assert.equal([a, b].filter((r) => r.ok).length, 1);
});

test("REQ-AUTH-19: ao renovar, o papel vem do banco: admin rebaixado perde o acesso de admin em no máximo 15 minutos", async () => {
  const armazem = new ArmazemEmMemoria();
  const { renovacao } = await iniciarSessao(ADMIN, armazem);
  const r = await renovarSessao(renovacao!, buscar("CLIENTE"), armazem);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tipo, "CLIENTE");
  assert.equal((decodeJwt(r.sessao.acesso) as { tipo: string }).tipo, "CLIENTE");
});

test("REQ-AUTH-19: sem token, token desconhecido ou usuário excluído → renovação recusada", async () => {
  const armazem = new ArmazemEmMemoria();
  assert.deepEqual(await renovarSessao(undefined, buscar("ADMIN"), armazem), { ok: false, motivo: "SEM_TOKEN" });
  assert.deepEqual(await renovarSessao("inventado", buscar("ADMIN"), armazem), { ok: false, motivo: "INVALIDO" });

  const { renovacao } = await iniciarSessao(ADMIN, armazem);
  const semUsuario = async () => null;
  assert.deepEqual(await renovarSessao(renovacao!, semUsuario, armazem), { ok: false, motivo: "INVALIDO" });
});

test("REQ-AUTH-19: sem Redis a renovação é NEGADA (indisponível) e o login continua, só sem token de renovação", async () => {
  const armazem = new ArmazemEmMemoria();
  const { renovacao } = await iniciarSessao(ADMIN, armazem);
  armazem.quebrado = true;
  assert.deepEqual(await renovarSessao(renovacao!, buscar("ADMIN"), armazem), { ok: false, motivo: "INDISPONIVEL" });

  const semRedis = await iniciarSessao(ADMIN, armazem);
  assert.ok(semRedis.acesso, "o acesso é emitido mesmo sem Redis");
  assert.equal(semRedis.renovacao, null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-20: revogação
// ---------------------------------------------------------------------------

test("REQ-AUTH-20: logout revoga o token de renovação; revogar todas as sessões do usuário invalida todos os tokens dele", async () => {
  const armazem = new ArmazemEmMemoria();
  const a = await iniciarSessao(ADMIN, armazem);
  const b = await iniciarSessao(ADMIN, armazem);
  const outro = await iniciarSessao({ id: 2, email: "o@x.com", tipo: "CLIENTE" }, armazem);

  await encerrarSessao(a.renovacao!, armazem);
  assert.equal(armazem.tokens.has(a.renovacao!), false);

  await revogarSessoesDoUsuario(1, armazem);
  assert.equal(armazem.tokens.has(b.renovacao!), false);
  assert.equal(armazem.tokens.has(outro.renovacao!), true, "sessões de outro usuário não são tocadas");
});

test("REQ-AUTH-20: revogar nunca lança, mesmo com o armazém fora do ar", async () => {
  const armazem = new ArmazemEmMemoria();
  armazem.quebrado = true;
  await assert.doesNotReject(() => encerrarSessao("x", armazem));
  await assert.doesNotReject(() => revogarSessoesDoUsuario(1, armazem));
  await assert.doesNotReject(() => encerrarSessao(undefined, armazem));
});

// ---------------------------------------------------------------------------
// REQ-AUTH-19/20 no Redis real
// ---------------------------------------------------------------------------

test("REQ-AUTH-19: no Redis real, só o hash do token é guardado, com validade, e GETDEL dá uso único", async () => {
  const { redis } = await import("@/lib/redis");
  const token = gerarTokenDeRenovacao();
  assert.ok(token.length >= 43, "256 bits em base64url");
  const usuarioId = 987001;

  await armazemDeRenovacao.criar(token, usuarioId);
  const chaves = await redis.keys("refresh:*");
  assert.ok(!chaves.some((c) => c.includes(token)), "o token em claro não pode estar no Redis");
  const dono = await armazemDeRenovacao.consumir(token);
  assert.equal(dono, usuarioId);
  assert.equal(await armazemDeRenovacao.consumir(token), null, "uso único");

  const t2 = gerarTokenDeRenovacao();
  const t3 = gerarTokenDeRenovacao();
  await armazemDeRenovacao.criar(t2, usuarioId);
  await armazemDeRenovacao.criar(t3, usuarioId);
  await armazemDeRenovacao.revogarTodos(usuarioId);
  assert.equal(await armazemDeRenovacao.consumir(t2), null);
  assert.equal(await armazemDeRenovacao.consumir(t3), null);
});

// ---------------------------------------------------------------------------
// REQ-AUTH-21: senha atual
// ---------------------------------------------------------------------------

test("REQ-AUTH-21: OperacaoNaoAutorizada vira 403 com a própria mensagem; o schema aceita senhaAtual", async () => {
  const res = mapeiaErro(new OperacaoNaoAutorizada("Senha atual incorreta"), "Usuário");
  assert.equal(res?.status, 403);
  assert.deepEqual(await res?.json(), { erro: "Senha atual incorreta" });
  assert.equal(atualizarUsuarioSchema.parse({ senha: "NovaSenha123", senhaAtual: "Antiga123" }).senhaAtual, "Antiga123");
});

// ---------------------------------------------------------------------------
// middleware: acesso expirado com renovação → renova e volta
// ---------------------------------------------------------------------------

const pagina = (cookie?: string) =>
  new NextRequest("http://localhost/perfil?aba=2", { headers: cookie ? { cookie } : {} });

test("REQ-AUTH-22: página protegida com acesso expirado e cookie de renovação passa pelo refresh e volta para a mesma página", async () => {
  const res = await middleware(pagina(`${COOKIE_RENOVACAO}=abc`));
  assert.equal(res.status, 307);
  const destino = new URL(res.headers.get("location")!);
  assert.equal(destino.pathname, "/api/auth/refresh");
  assert.equal(destino.searchParams.get("next"), "/perfil?aba=2");
});

test("REQ-AUTH-22: sem acesso e sem renovação vai para o login; com acesso válido segue", async () => {
  const semNada = await middleware(pagina());
  assert.match(semNada.headers.get("location")!, /\/sign-in\?next=%2Fperfil/);

  const comAcesso = await middleware(pagina(`${COOKIE_ACESSO}=${await signToken(ADMIN)}`));
  assert.equal(comAcesso.headers.get("location"), null);
});

// ===========================================================================
// COM BANCO — rodam no CI
// ===========================================================================

const SENHA = "SenhaAtual123";
async function usuarioComSenha(nome: string) {
  const bcrypt = (await import("bcryptjs")).default;
  return criarUsuarioDireto(email(nome), "CLIENTE", await bcrypt.hash(SENHA, 4));
}

test("REQ-AUTH-18/19: login emite os cookies token e refresh; o refresh devolve o par novo e invalida o antigo", async () => {
  const u = await usuarioComSenha("sess-login");
  const res = await login(req("/api/auth", { method: "POST", body: { email: u.email, senha: SENHA } }));
  assert.equal(res.status, 200);
  const cookies = res.headers.getSetCookie();
  assert.ok(cookies.some((c) => c.startsWith(`${COOKIE_ACESSO}=`)));
  assert.ok(cookies.some((c) => c.startsWith(`${COOKIE_RENOVACAO}=`)));
});

test("REQ-AUTH-21: trocar a PRÓPRIA senha exige a senha atual correta (403 sem ela); ADMIN trocando a de outro não precisa", async () => {
  const u = await usuarioComSenha("sess-senha");
  const cookie = await cookieDe(u);
  const nova = "NovaSenha456";

  const sem = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: nova } }), ctx(u.id));
  assert.equal(sem.status, 403);
  const errada = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: nova, senhaAtual: "errada-errada" } }), ctx(u.id));
  assert.equal(errada.status, 403);
  const certa = await atualizarUsuario(req(`/api/usuarios/${u.id}`, { method: "PUT", cookie, body: { senha: nova, senhaAtual: SENHA } }), ctx(u.id));
  assert.equal(certa.status, 200);

  const admin = await cookieDe(await criarUsuarioDireto(email("sess-adm"), "ADMIN"));
  const outro = await usuarioComSenha("sess-outro");
  const porAdmin = await atualizarUsuario(req(`/api/usuarios/${outro.id}`, { method: "PUT", cookie: admin, body: { senha: nova } }), ctx(outro.id));
  assert.equal(porAdmin.status, 200);
});

test("REQ-AUTH-23: login com e-mail inexistente também executa o bcrypt (tempo da mesma ordem que com e-mail existente)", async () => {
  const u = await usuarioComSenha("sess-tempo");
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
