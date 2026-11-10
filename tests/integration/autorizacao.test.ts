// Capacidade AUTZ — docs/capabilities/autorizacao/spec.md  (ADR-0017)
import {
  email,
  criarUsuarioDireto,
  cookieDe,
  req,
  ctx,
  encerrar,
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

after(encerrar);

test("REQ-AUTZ-01: escrita no catálogo exige ADMIN (401 sem login, 403 para CLIENTE)", async () => {
  const cliente = await criarUsuarioDireto(email("authz01"), "CLIENTE");
  const cookie = await cookieDe(cliente);
  const rotas: [
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
  for (const [nome, handler, method, body] of rotas) {
    assert.equal(
      (await handler(req(`/api/${nome}`, { method, body }))).status,
      401,
      `${nome} sem login`,
    );
    assert.equal(
      (await handler(req(`/api/${nome}`, { method, cookie, body }))).status,
      403,
      `${nome} CLIENTE`,
    );
  }
  const del = (c?: string) =>
    deletarProduto(
      req("/api/produtos/1", { method: "DELETE", cookie: c }),
      ctx(1),
    );
  assert.equal((await del()).status, 401);
  assert.equal((await del(cookie)).status, 403);
  const foto = (c?: string) =>
    uploadFoto(
      req("/api/produtos/1/fotos", {
        method: "POST",
        cookie: c,
        form: new FormData(),
      }),
      ctx(1),
    );
  assert.equal((await foto()).status, 401);
  assert.equal((await foto(cookie)).status, 403);
});

test("REQ-AUTZ-02: a leitura do catálogo (produtos e categorias) é pública", async () => {
  assert.equal((await listarProdutos(req("/api/produtos"))).status, 200);
  assert.equal((await listarCategorias()).status, 200);
});

test("REQ-AUTZ-03: scan e chat de IA exigem usuário autenticado", async () => {
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

test("REQ-AUTZ-04: listar e criar usuários é exclusivo de ADMIN", async () => {
  const cliente = await criarUsuarioDireto(email("authz04"), "CLIENTE");
  assert.equal((await listarUsuarios(req("/api/usuarios"))).status, 401);
  assert.equal(
    (
      await listarUsuarios(
        req("/api/usuarios", { cookie: await cookieDe(cliente) }),
      )
    ).status,
    403,
  );
});

test("REQ-AUTZ-05: /api/usuarios/[id]: o próprio usuário ou ADMIN; excluir só ADMIN", async () => {
  const a = await criarUsuarioDireto(email("authz05a"), "CLIENTE");
  const b = await criarUsuarioDireto(email("authz05b"), "CLIENTE");
  const admin = await criarUsuarioDireto(email("authz05admin"), "ADMIN");
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
 * REQ-AUTZ-07: "negar por padrão" como guarda de regressão.
 *
 * Não existe tabela central de políticas por rota (ADR-0017 decidiu
 * deliberadamente que a autorização mora no handler, não no middleware).
 * Este teste supre a falta de uma tabela central fazendo o equivalente por
 * análise estática: percorre todo `app/api/**\/route.ts`, acha cada handler
 * exportado (GET/POST/PUT/DELETE/PATCH) e falha se o handler não chama
 * `requireAuth`/`requireAdmin`/`getSession` E não está na lista explícita de
 * rotas públicas abaixo. Uma rota nova sem nenhuma das duas coisas quebra
 * este teste — não fica pública "por acidente".
 */
test("REQ-AUTZ-07: toda rota de API declara sua política de acesso (autenticação explícita, ou pública na allowlist)", () => {
  const API_DIR = path.join(process.cwd(), "app", "api");

  // Rotas intencionalmente públicas (leitura do catálogo, login, cadastro,
  // logout e health-check). Qualquer outra precisa chamar um guard.
  const PUBLICAS = new Set([
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
  const METODOS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  function listarArquivosRoute(dir: string): string[] {
    const resultado: string[] = [];
    for (const nome of fs.readdirSync(dir)) {
      const caminho = path.join(dir, nome);
      if (fs.statSync(caminho).isDirectory()) {
        resultado.push(...listarArquivosRoute(caminho));
      } else if (nome === "route.ts") {
        resultado.push(caminho);
      }
    }
    return resultado;
  }

  /** Extrai o corpo (entre chaves balanceadas) de uma função a partir do índice do seu "{" inicial. */
  function corpoAPartirDe(fonte: string, indiceAbreChave: number): string {
    let profundidade = 0;
    for (let i = indiceAbreChave; i < fonte.length; i++) {
      if (fonte[i] === "{") profundidade++;
      if (fonte[i] === "}") {
        profundidade--;
        if (profundidade === 0) return fonte.slice(indiceAbreChave, i + 1);
      }
    }
    return fonte.slice(indiceAbreChave);
  }

  /**
   * Acha o "{" que abre o CORPO da função (não o de uma desestruturação de
   * parâmetro, ex. `{ params }: { params: Promise<{ id: string }> }`).
   * Conta parênteses a partir do primeiro "(" após o nome da função até seu
   * fechamento, e só então procura o próximo "{" — esse é o corpo real.
   */
  function corpoDoHandler(fonte: string, indiceNomeFuncao: number): string {
    const abreParen = fonte.indexOf("(", indiceNomeFuncao);
    let profundidade = 0;
    let i = abreParen;
    for (; i < fonte.length; i++) {
      if (fonte[i] === "(") profundidade++;
      if (fonte[i] === ")") {
        profundidade--;
        if (profundidade === 0) break;
      }
    }
    const abreChave = fonte.indexOf("{", i);
    return corpoAPartirDe(fonte, abreChave);
  }

  const semPolitica: string[] = [];

  for (const arquivo of listarArquivosRoute(API_DIR)) {
    const fonte = fs.readFileSync(arquivo, "utf8");
    const chaveArquivo = path
      .relative(API_DIR, arquivo)
      .split(path.sep)
      .join("/");

    for (const metodo of METODOS) {
      const re = new RegExp(`export\\s+async\\s+function\\s+${metodo}\\s*\\(`);
      const m = re.exec(fonte);
      if (!m) continue;

      const chave = `${chaveArquivo}:${metodo}`;
      if (PUBLICAS.has(chave)) continue;

      const corpo = corpoDoHandler(fonte, m.index);
      const declaraGuard = GUARDS.some((g) => corpo.includes(g));
      if (!declaraGuard) semPolitica.push(chave);
    }
  }

  assert.deepEqual(
    semPolitica,
    [],
    `Rota(s) de API sem política de acesso declarada (nem guard, nem na allowlist de públicas): ${semPolitica.join(", ")}`,
  );
});
