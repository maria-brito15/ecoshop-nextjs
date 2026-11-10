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
