// Capacidades CAT, PROD e REF — docs/capabilities/{catalogo,gestao-de-produtos,cadastros-de-referencia}
import {
  RUN,
  email,
  criarUsuarioDireto,
  cookieDe,
  req,
  ctx,
  encerrar,
} from "./helpers";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { GET as listar, POST as criarProduto } from "@/app/api/produtos/route";
import { GET as detalhe } from "@/app/api/produtos/[id]/route";
import { POST as criarCategoria } from "@/app/api/categorias/route";
import { DELETE as excluirCategoria } from "@/app/api/categorias/[id]/route";
import { PUT as atualizarMarca } from "@/app/api/marcas/[id]/route";

after(async () => {
  await encerrar();
});

let categoriaId = 0;
let marcaId = 0;
let adminCookie = "";
const prefixo = `Cat${RUN}`;

before(async () => {
  const admin = await criarUsuarioDireto(email("cat-admin"), "ADMIN");
  adminCookie = await cookieDe(admin);
  const dono = await criarUsuarioDireto(email("cat-marca"), "MARCA");
  const categoria = await prisma.categoria.create({
    data: { nome: `Categoria ${prefixo}` },
  });
  const marca = await prisma.marca.create({
    data: { nome: `Marca ${prefixo}`, usuarioId: dono.id },
  });
  categoriaId = categoria.id;
  marcaId = marca.id;
  await prisma.produto.createMany({
    data: Array.from({ length: 14 }, (_, i) => ({
      nome: `Produto ${prefixo} ${String(i).padStart(2, "0")}`,
      preco: 10 + i,
      categoriaId,
      marcaId,
    })),
  });
});

const lista = async (query: string) =>
  (await listar(req(`/api/produtos?${query}`))).json();

test("REQ-CAT-01: o catálogo lista 12 produtos por página, com o total de resultados", async () => {
  const p1 = await lista(`nome=${prefixo}`);
  assert.equal(p1.total, 14);
  assert.equal(p1.produtos.length, 12);
  assert.equal(p1.page, 1);
  const p2 = await lista(`nome=${prefixo}&page=2`);
  assert.equal(p2.produtos.length, 2);
});

test("REQ-CAT-02: a busca por nome ignora maiúsculas e minúsculas", async () => {
  const r = await lista(`nome=${prefixo.toUpperCase()}`);
  assert.equal(r.total, 14);
});

test("REQ-CAT-03: o filtro por categoria devolve só produtos dela", async () => {
  const r = await lista(`categoriaId=${categoriaId}&size=50`);
  assert.equal(r.total, 14);
  assert.ok(
    r.produtos.every(
      (p: { categoria: { id: number } }) => p.categoria.id === categoriaId,
    ),
  );
});

test("REQ-CAT-04: produto inexistente responde 404", async () => {
  assert.equal(
    (await detalhe(req("/api/produtos/99999999"), ctx(99999999))).status,
    404,
  );
});

test(
  "REQ-CAT-05: page ou size inválidos, ou size acima de 100, respondem 400",
  { todo: "D9: hoje aceita qualquer valor" },
  async () => {
    assert.equal((await listar(req("/api/produtos?size=1000"))).status, 400);
    assert.equal((await listar(req("/api/produtos?page=abc"))).status, 400);
  },
);

test("REQ-PROD-01: produto criado por ADMIN aparece no catálogo logo depois (cache invalidado)", async () => {
  const nome = `Novo ${prefixo}`;
  assert.equal((await lista(`nome=${encodeURIComponent(nome)}`)).total, 0);
  const res = await criarProduto(
    req("/api/produtos", {
      method: "POST",
      cookie: adminCookie,
      body: { nome, preco: 25.5, categoriaId, marcaId },
    }),
  );
  assert.equal(res.status, 201);
  assert.equal((await lista(`nome=${encodeURIComponent(nome)}`)).total, 1);
});

test(
  "REQ-PROD-02: renomear uma marca reflete no detalhe do produto sem esperar o TTL",
  { todo: "NFR-CONS-01: marca não invalida produtos" },
  async () => {
    const produto = await prisma.produto.findFirstOrThrow({
      where: { marcaId },
    });
    const antes = await (
      await detalhe(req(`/api/produtos/${produto.id}`), ctx(produto.id))
    ).json();
    assert.equal(antes.produto.marca.nome, `Marca ${prefixo}`);
    await atualizarMarca(
      req(`/api/marcas/${marcaId}`, {
        method: "PUT",
        cookie: adminCookie,
        body: { nome: `Marca ${prefixo} v2` },
      }),
      ctx(marcaId),
    );
    const depois = await (
      await detalhe(req(`/api/produtos/${produto.id}`), ctx(produto.id))
    ).json();
    assert.equal(depois.produto.marca.nome, `Marca ${prefixo} v2`);
  },
);

test("REQ-REF-01: ADMIN cria categoria (201)", async () => {
  const res = await criarCategoria(
    req("/api/categorias", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Nova ${prefixo}` },
    }),
  );
  assert.equal(res.status, 201);
});

test(
  "REQ-REF-02: criar categoria com nome já existente responde 409",
  { todo: "hoje a violação de unicidade vira 500" },
  async () => {
    const res = await criarCategoria(
      req("/api/categorias", {
        method: "POST",
        cookie: adminCookie,
        body: { nome: `Categoria ${prefixo}` },
      }),
    );
    assert.equal(res.status, 409);
  },
);

test(
  "REQ-REF-03: excluir categoria que tem produtos responde 409",
  {
    todo: "D7: hoje vira 404 (a mensagem do erro do Prisma contém o texto P2025 do código-fonte)",
  },
  async () => {
    const res = await excluirCategoria(
      req(`/api/categorias/${categoriaId}`, {
        method: "DELETE",
        cookie: adminCookie,
      }),
      ctx(categoriaId),
    );
    assert.equal(res.status, 409);
  },
);
