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
  criarUsuarioDireto,
  cookieDe,
  req,
  ctx,
  encerrar,
  stubFetch,
  json,
} from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RecursoNaoEncontrado, ConflitoDeNegocio } from "@/lib/errors/dominio";
import { mapeiaErro } from "@/lib/http/responses";
import { parseId } from "@/lib/schemas/id";
import {
  loginSchema,
  cadastroAdminSchema,
  registroPublicoSchema,
  atualizarUsuarioSchema,
} from "@/lib/schemas/usuario";
import { chatSchema } from "@/lib/schemas/ia-chat";
import { caminhoLocalOuRaiz } from "@/lib/http/next-url";
import { fetchComTimeout } from "@/lib/http/fetch-com-timeout";
import { classificarImagem } from "@/lib/ai/providers/azure-vision";
import { gerarTexto } from "@/lib/ai/providers/gemini-chat";
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

after(encerrar);

const IDS_INVALIDOS = ["abc", "0", "-1", "1.5", "1e3", " 7", "2147483648", ""];

const admin = () => cookieDe({ id: 987654, email: "adm@test.local", tipo: "ADMIN" });

// ---------------------------------------------------------------------------
// Mapeador de erros (Art. VII) — REQ-USR-07
// ---------------------------------------------------------------------------

const erroPrisma = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("falha", {
    code,
    clientVersion: "teste",
  });

test("REQ-USR-07: erro de domínio vira a resposta HTTP certa (404 e 409), com a mensagem original", async () => {
  const naoEncontrado = mapeiaErro(new RecursoNaoEncontrado("Usuário"), "Qualquer");
  assert.equal(naoEncontrado?.status, 404);
  assert.deepEqual(await naoEncontrado?.json(), { erro: "Usuário não encontrado" });

  const conflito = mapeiaErro(new ConflitoDeNegocio("Email já cadastrado"), "Qualquer");
  assert.equal(conflito?.status, 409);
  assert.deepEqual(await conflito?.json(), { erro: "Email já cadastrado" });
});

test("REQ-USR-07: código do Prisma vira 404 (P2025) e 409 (P2002, P2003); desconhecido não vira resposta", () => {
  assert.equal(mapeiaErro(erroPrisma("P2025"), "Usuário")?.status, 404);
  assert.equal(mapeiaErro(erroPrisma("P2002"), "Usuário")?.status, 409);
  assert.equal(mapeiaErro(erroPrisma("P2003"), "Usuário")?.status, 409);
  assert.equal(mapeiaErro(erroPrisma("P2999"), "Usuário"), null);
});

test("REQ-USR-07: o mapeador nunca decide pelo texto da mensagem (Art. VII.2)", () => {
  for (const texto of ["P2025", "P2003", "EMAIL_JA_CADASTRADO", "MARCA_NAO_PENDENTE"]) {
    assert.equal(mapeiaErro(new Error(texto), "Usuário"), null, texto);
  }
  assert.equal(
    mapeiaErro(new Error("mensagem com P2025 no meio"), "Usuário"),
    null,
  );
});

// ---------------------------------------------------------------------------
// parseId e rotas [id] — REQ-CAT-09, PROD-06, MIDIA-05, REF-05, USR-06
// ---------------------------------------------------------------------------

test("REQ-REF-05: parseId aceita só inteiro positivo de até 4 bytes, sem sinal, zero à esquerda ou notação", () => {
  assert.equal(parseId("1"), 1);
  assert.equal(parseId("42"), 42);
  assert.equal(parseId("2147483647"), 2147483647);
  for (const invalido of [...IDS_INVALIDOS, "007", "7abc", "+7", "١٢"]) {
    assert.equal(parseId(invalido), null, JSON.stringify(invalido));
  }
});

test("REQ-CAT-09: GET /api/produtos/[id] com id inválido responde 400", async () => {
  for (const id of IDS_INVALIDOS.filter((i) => i !== "")) {
    const res = await produtoGet(req(`/api/produtos/${id}`), ctx(id));
    assert.equal(res.status, 400, `id=${JSON.stringify(id)}`);
  }
});

test("REQ-PROD-06: PUT e DELETE /api/produtos/[id] com id inválido respondem 400 (corpo válido)", async () => {
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

test("REQ-REF-05: categorias, marcas e certificados com id inválido respondem 400 em GET, PUT e DELETE", async () => {
  const cookie = await admin();
  const recursos = [
    ["categorias", categoriaGet, categoriaPut, categoriaDelete],
    ["marcas", marcaGet, marcaPut, marcaDelete],
    ["certificados", certificadoGet, certificadoPut, certificadoDelete],
  ] as const;
  for (const [nome, get, put, del] of recursos) {
    for (const id of ["abc", "0", "1.5"]) {
      const url = `/api/${nome}/${id}`;
      assert.equal((await get(req(url), ctx(id))).status, 400, `GET ${nome} ${id}`);
      assert.equal(
        (await put(req(url, { method: "PUT", cookie, body: { nome: "Nome válido" } }), ctx(id))).status,
        400,
        `PUT ${nome} ${id}`,
      );
      assert.equal(
        (await del(req(url, { method: "DELETE", cookie }), ctx(id))).status,
        400,
        `DELETE ${nome} ${id}`,
      );
    }
  }
});

test("REQ-MIDIA-05: rotas de fotos com id inválido respondem 400", async () => {
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

test("REQ-USR-06: /api/usuarios/[id] e aprovar marca com id inválido respondem 400 para ADMIN", async () => {
  const cookie = await admin();
  for (const id of ["abc", "0", "1.5"]) {
    assert.equal((await usuarioGet(req(`/api/usuarios/${id}`, { cookie }), ctx(id))).status, 400, `GET ${id}`);
    assert.equal(
      (await usuarioPut(req(`/api/usuarios/${id}`, { method: "PUT", cookie, body: { nome: "Nome válido" } }), ctx(id))).status,
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

test("REQ-USR-08: ADMIN que tenta excluir a própria conta recebe 409 (a regra vale antes de qualquer acesso ao banco)", async () => {
  const eu = { id: 424242, email: "auto-del@test.local", tipo: "ADMIN" as const };
  const cookie = await cookieDe(eu);
  const res = await usuarioDelete(
    req(`/api/usuarios/${eu.id}`, { method: "DELETE", cookie }),
    ctx(eu.id),
  );
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { erro: "Você não pode excluir a própria conta" });
});

test("REQ-USR-06: a sessão é checada antes do id (visitante recebe 403, não 400)", async () => {
  const res = await usuarioGet(req("/api/usuarios/abc"), ctx("abc"));
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------------------
// E-mail e senha — REQ-AUTH-15 e REQ-AUTH-16
// ---------------------------------------------------------------------------

test("REQ-AUTH-15: os schemas normalizam o e-mail (espaços e caixa) no login, cadastro e atualização", () => {
  const sujo = "  Foo.Bar@Exemplo.COM ";
  const limpo = "foo.bar@exemplo.com";
  assert.equal(loginSchema.parse({ email: sujo, senha: "x" }).email, limpo);
  assert.equal(
    cadastroAdminSchema.parse({ nome: "Fulano", email: sujo, senha: "Senha12345" }).email,
    limpo,
  );
  assert.equal(
    registroPublicoSchema.parse({ nome: "Fulano", email: sujo, senha: "Senha12345" }).email,
    limpo,
  );
  assert.equal(atualizarUsuarioSchema.parse({ email: sujo }).email, limpo);
});

test("REQ-AUTH-16: senha acima de 72 bytes é recusada; 72 bytes é aceita (conta bytes, não caracteres)", () => {
  const base = { nome: "Fulano", email: "a@b.com" };
  assert.ok(registroPublicoSchema.safeParse({ ...base, senha: "a".repeat(72) }).success);
  assert.ok(!registroPublicoSchema.safeParse({ ...base, senha: "a".repeat(73) }).success);
  // "ç" ocupa 2 bytes em UTF-8: 37 × 2 = 74 bytes, mas só 37 caracteres
  assert.ok(!registroPublicoSchema.safeParse({ ...base, senha: "ç".repeat(37) }).success);
  assert.ok(registroPublicoSchema.safeParse({ ...base, senha: "ç".repeat(36) }).success);
  assert.ok(!cadastroAdminSchema.safeParse({ ...base, senha: "a".repeat(73) }).success);
  assert.ok(!atualizarUsuarioSchema.safeParse({ senha: "a".repeat(73) }).success);
});

// ---------------------------------------------------------------------------
// ?next= do login — REQ-AUTH-17
// ---------------------------------------------------------------------------

test("REQ-AUTH-17: caminhoLocalOuRaiz aceita caminho local e manda todo o resto para /", () => {
  assert.equal(caminhoLocalOuRaiz("/perfil"), "/perfil");
  assert.equal(caminhoLocalOuRaiz("/produtos?categoria=2#topo"), "/produtos?categoria=2#topo");
  assert.equal(caminhoLocalOuRaiz("/"), "/");
  for (const perigoso of [
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
    assert.equal(caminhoLocalOuRaiz(perigoso), "/", JSON.stringify(perigoso));
  }
});

// ---------------------------------------------------------------------------
// Chat — REQ-CHAT-08 e REQ-CHAT-09
// ---------------------------------------------------------------------------

const item = (texto: string) => ({ role: "user" as const, parts: [{ text: texto }] });

test("REQ-CHAT-08: o schema recusa historico com mais de 20 itens, texto acima de 2000 caracteres ou mais de 5 partes", () => {
  const ok = (historico: unknown[]) => chatSchema.safeParse({ mensagem: "oi", historico }).success;
  assert.ok(ok(Array.from({ length: 20 }, () => item("oi"))));
  assert.ok(!ok(Array.from({ length: 21 }, () => item("oi"))));
  assert.ok(ok([item("a".repeat(2000))]));
  assert.ok(!ok([item("a".repeat(2001))]));
  assert.ok(!ok([{ role: "user", parts: Array.from({ length: 6 }, () => ({ text: "x" })) }]));
});

test("REQ-CHAT-08: a chave do Gemini vai no cabeçalho x-goog-api-key, nunca na URL", async () => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
  const cookie = await cookieDe({ id: 111, email: "chat08@test.local", tipo: "CLIENTE" });
  let urlUsada = "";
  let cabecalhos: Record<string, string> = {};
  const restaurar = stubFetch((url, init) => {
    urlUsada = url;
    cabecalhos = (init?.headers ?? {}) as Record<string, string>;
    return json({ candidates: [{ content: { parts: [{ text: "ok" }] } }] });
  });
  try {
    const res = await chat(req("/api/ia/chat", { method: "POST", cookie, body: { mensagem: "Como reciclar pilhas?" } }));
    assert.equal(res.status, 200);
    assert.ok(!urlUsada.includes("key="), "a chave não pode estar na URL");
    assert.equal(cabecalhos["x-goog-api-key"], "chave-gemini-de-teste-123");

    // o mesmo vale para o provedor usado pelo EcoScan
    urlUsada = "";
    cabecalhos = {};
    await gerarTexto("prompt");
    assert.ok(!urlUsada.includes("key="));
    assert.equal(cabecalhos["x-goog-api-key"], "chave-gemini-de-teste-123");
  } finally {
    restaurar();
  }
});

test("REQ-CHAT-08: historico com 21 itens responde 400", async () => {
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

test("REQ-CHAT-09: se a chamada ao Gemini lança erro, o chat responde 502 (não 500)", async () => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
  const cookie = await cookieDe({ id: 113, email: "chat09@test.local", tipo: "CLIENTE" });
  const restaurar = stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  try {
    const res = await chat(req("/api/ia/chat", { method: "POST", cookie, body: { mensagem: "oi" } }));
    assert.equal(res.status, 502);
  } finally {
    restaurar();
  }
});

// ---------------------------------------------------------------------------
// Timeouts — REQ-SCAN-09
// ---------------------------------------------------------------------------

/** `fetch` que nunca responde, mas rejeita quando o `signal` aborta. */
const fetchPenduradoAteAbortar = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_, rejeita) => {
    if (!init?.signal) return; // sem signal fica pendurado: o corredor abaixo acusa a falha
    init.signal.addEventListener("abort", () => rejeita(init.signal!.reason));
  });

/** Falha claramente (em vez de travar o teste) se a promessa não terminar. */
const comPrazo = <T,>(promessa: Promise<T>, ms = 2000) =>
  Promise.race([
    promessa,
    new Promise<never>((_, rejeita) => setTimeout(() => rejeita(new Error("sem timeout: a chamada ficou pendurada")), ms)),
  ]);

test("REQ-SCAN-09: fetchComTimeout aborta a chamada que não responde", async () => {
  const restaurar = stubFetch(fetchPenduradoAteAbortar);
  try {
    await assert.rejects(() => comPrazo(fetchComTimeout("http://exemplo.test", {}, 20)), (e: Error) => !/sem timeout/.test(e.message));
  } finally {
    restaurar();
  }
});

test("REQ-SCAN-09: o Azure que não responde no tempo limite vira falha tratada (null), não exceção", async () => {
  const restaurar = stubFetch(fetchPenduradoAteAbortar);
  try {
    assert.equal(await comPrazo(classificarImagem(Buffer.from("x"), 20)), null);
  } finally {
    restaurar();
  }
});

test("REQ-SCAN-09: o Gemini que não responde, ou lança erro, vira null (o scan usa a contingência)", async () => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
  let restaurar = stubFetch(fetchPenduradoAteAbortar);
  try {
    assert.equal(await comPrazo(gerarTexto("prompt", undefined, 20)), null);
  } finally {
    restaurar();
  }
  restaurar = stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  try {
    assert.equal(await gerarTexto("prompt"), null);
  } finally {
    restaurar();
  }
});

test("REQ-SCAN-05: se a rede do Gemini falha, o scan devolve a análise de contingência (sem banco)", async () => {
  const restaurar = stubFetch((url) => {
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
    restaurar();
  }
});

// ===========================================================================
// COM BANCO — rodam no CI (precisam de Postgres)
// ===========================================================================

test("REQ-USR-07: PUT de usuário inexistente por ADMIN responde 404", async () => {
  const cookie = await cookieDe(await criarUsuarioDireto(email("e404-admin"), "ADMIN"));
  const res = await usuarioPut(
    req("/api/usuarios/2147000000", { method: "PUT", cookie, body: { nome: "Nome válido" } }),
    ctx(2147000000),
  );
  assert.equal(res.status, 404);
});

test("REQ-USR-07: PUT com e-mail de outro usuário responde 409", async () => {
  const cookie = await cookieDe(await criarUsuarioDireto(email("e409-admin"), "ADMIN"));
  const outro = await criarUsuarioDireto(email("e409-outro"));
  const alvo = await criarUsuarioDireto(email("e409-alvo"));
  const res = await usuarioPut(
    req(`/api/usuarios/${alvo.id}`, { method: "PUT", cookie, body: { email: outro.email } }),
    ctx(alvo.id),
  );
  assert.equal(res.status, 409);
});

test("REQ-USR-07: DELETE de usuário que tem marca responde 409 e mantém o usuário", async () => {
  const cookie = await cookieDe(await criarUsuarioDireto(email("fk-admin"), "ADMIN"));
  const dono = await criarUsuarioDireto(email("fk-dono"), "MARCA");
  await prisma.marca.create({ data: { nome: `Marca FK ${dono.email}`, usuarioId: dono.id, status: "APROVADA" } });
  const res = await usuarioDelete(req(`/api/usuarios/${dono.id}`, { method: "DELETE", cookie }), ctx(dono.id));
  assert.equal(res.status, 409);
  assert.ok(await prisma.usuario.findUnique({ where: { id: dono.id } }));
});

test("REQ-AUTH-15: cadastro grava o e-mail em minúsculas e recusa o mesmo e-mail com outra caixa", async () => {
  const minusculo = email("caixa");
  const misto = minusculo.replace("caixa", "CaIxA").replace("@test.local", "@TEST.local");
  await prisma.usuario.deleteMany({ where: { email: minusculo } });
  const novo = { nome: "Usuario Caixa", senha: "Senha12345" };

  const primeiro = await cadastrar(req("/api/users", { method: "POST", body: { ...novo, email: misto } }));
  assert.equal(primeiro.status, 201);
  assert.ok(await prisma.usuario.findUnique({ where: { email: minusculo } }), "gravado em minúsculas");

  const repetido = await cadastrar(req("/api/users", { method: "POST", body: { ...novo, email: minusculo } }));
  assert.equal(repetido.status, 409);
});

test("REQ-AUTH-15: conta antiga com e-mail de caixa mista continua entrando por qualquer caixa", async () => {
  const legado = email("legado").replace("legado", "LeGaDo");
  await prisma.usuario.deleteMany({ where: { email: legado } });
  await prisma.usuario.create({
    data: { nome: "Legado", email: legado, senha: await bcrypt.hash("Senha12345", 4), tipo: "CLIENTE" },
  });
  const res = await login(req("/api/auth", { method: "POST", body: { email: legado.toLowerCase(), senha: "Senha12345" } }));
  assert.equal(res.status, 200);
});
