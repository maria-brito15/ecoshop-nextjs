// Capacidades CAT, PROD e REF — docs/capabilities/{catalogo,gestao-de-produtos,cadastros-de-referencia}
import {
  RUN,
  email,
  createUserDirectly,
  cookieDe,
  req,
  ctx,
  closeConnections,
} from "./helpers";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { GET as listar, POST as criarProduto } from "@/app/api/produtos/route";
import {
  GET as detalhe,
  PUT as atualizarProduto,
} from "@/app/api/produtos/[id]/route";
import { POST as criarCategoria } from "@/app/api/categorias/route";
import { DELETE as excluirCategoria } from "@/app/api/categorias/[id]/route";
import { POST as criarMarca } from "@/app/api/marcas/route";
import { PUT as atualizarMarca } from "@/app/api/marcas/[id]/route";

after(async () => {
  await closeConnections();
});

let categoryId = 0;
let brandId = 0;
let adminCookie = "";
const prefix = `Cat${RUN}`;

before(async () => {
  const admin = await createUserDirectly(email("cat-admin"), "ADMIN");
  adminCookie = await cookieDe(admin);
  const owner = await createUserDirectly(email("cat-marca"), "MARCA");
  const category = await prisma.categoria.create({
    data: { nome: `Categoria ${prefix}` },
  });
  const brand = await prisma.marca.create({
    data: { nome: `Marca ${prefix}`, usuarioId: owner.id },
  });
  categoryId = category.id;
  brandId = brand.id;
  await prisma.produto.createMany({
    data: Array.from({ length: 14 }, (_, i) => ({
      nome: `Produto ${prefix} ${String(i).padStart(2, "0")}`,
      preco: 10 + i,
      categoriaId: categoryId,
      marcaId: brandId,
    })),
  });
});

const list = async (query: string) =>
  (await listar(req(`/api/produtos?${query}`))).json();

test("REQ-CAT-01: o catálogo lista 12 produtos por página, com o total de resultados", async () => {
  const p1 = await list(`nome=${prefix}`);
  assert.equal(p1.total, 14);
  assert.equal(p1.produtos.length, 12);
  assert.equal(p1.page, 1);
  const p2 = await list(`nome=${prefix}&page=2`);
  assert.equal(p2.produtos.length, 2);
});

test("REQ-CAT-02: a busca por nome ignora maiúsculas e minúsculas", async () => {
  const r = await list(`nome=${prefix.toUpperCase()}`);
  assert.equal(r.total, 14);
});

test("REQ-CAT-03: o filtro por categoria devolve só produtos dela", async () => {
  const r = await list(`categoriaId=${categoryId}&size=50`);
  assert.equal(r.total, 14);
  assert.ok(
    r.produtos.every(
      (p: { categoria: { id: number } }) => p.categoria.id === categoryId,
    ),
  );
});

test("REQ-CAT-04: produto inexistente responde 404", async () => {
  assert.equal(
    (await detalhe(req("/api/produtos/99999999"), ctx(99999999))).status,
    404,
  );
});

test("REQ-CAT-05: page ou size inválidos, ou size acima de 100, respondem 400", async () => {
  assert.equal((await listar(req("/api/produtos?size=1000"))).status, 400);
  assert.equal((await listar(req("/api/produtos?page=abc"))).status, 400);
  // o painel pede size=100 (caso-limite da spec): tem que continuar aceito
  assert.equal((await listar(req("/api/produtos?size=100"))).status, 200);
});

test("REQ-CAT-06: ordenar por preço aplica ao catálogo inteiro, não só à página", async () => {
  // Os 14 produtos do before() têm preço 10..23 (nome em ordem crescente também).
  const desc = await list(`nome=${prefix}&size=5&sort=preco_desc`);
  assert.equal(desc.total, 14);
  assert.equal(desc.produtos.length, 5);
  const pricesDesc = desc.produtos.map((p: { preco: number }) => Number(p.preco));
  assert.deepEqual(pricesDesc, [23, 22, 21, 20, 19]);

  const page2 = await list(
    `nome=${prefix}&size=5&page=2&sort=preco_desc`,
  );
  const page2Prices = page2.produtos.map((p: { preco: number }) =>
    Number(p.preco),
  );
  assert.deepEqual(page2Prices, [18, 17, 16, 15, 14]);
});

test("REQ-CAT-06: precoMax limita o catálogo inteiro, não só a página", async () => {
  const r = await list(`nome=${prefix}&size=3&precoMax=15`);
  // preços 10..15 => 6 produtos no total, mesmo pedindo só 3 por página
  assert.equal(r.total, 6);
  assert.ok(
    r.produtos.every((p: { preco: number }) => Number(p.preco) <= 15),
  );
});

test("REQ-CAT-07: o filtro por marca devolve só produtos dela", async () => {
  const otherOwner = await createUserDirectly(email("cat07-marca"), "MARCA");
  const otherBrand = await prisma.marca.create({
    data: { nome: `Outra Marca ${prefix}`, usuarioId: otherOwner.id },
  });
  await prisma.produto.create({
    data: {
      nome: `Produto outra marca ${prefix}`,
      preco: 99,
      categoriaId: categoryId,
      marcaId: otherBrand.id,
    },
  });

  const r = await list(`nome=${prefix}&marcaId=${otherBrand.id}&size=50`);
  assert.equal(r.total, 1);
  assert.equal(r.produtos[0].marca.id, otherBrand.id);
});

test("REQ-PROD-01: produto criado por ADMIN aparece no catálogo logo depois (cache invalidado)", async () => {
  const name = `Novo ${prefix}`;
  assert.equal((await list(`nome=${encodeURIComponent(name)}`)).total, 0);
  const res = await criarProduto(
    req("/api/produtos", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: name, preco: 25.5, categoriaId: categoryId, marcaId: brandId },
    }),
  );
  assert.equal(res.status, 201);
  assert.equal((await list(`nome=${encodeURIComponent(name)}`)).total, 1);
});

test("REQ-PROD-02: renomear uma marca reflete no detalhe do produto sem esperar o TTL", async () => {
  const product = await prisma.produto.findFirstOrThrow({
    where: { marcaId: brandId },
  });
  const detailBefore = await (
    await detalhe(req(`/api/produtos/${product.id}`), ctx(product.id))
  ).json();
  assert.equal(detailBefore.produto.marca.nome, `Marca ${prefix}`);
  await atualizarMarca(
    req(`/api/marcas/${brandId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { nome: `Marca ${prefix} v2` },
    }),
    ctx(brandId),
  );
  const detailAfter = await (
    await detalhe(req(`/api/produtos/${product.id}`), ctx(product.id))
  ).json();
  assert.equal(detailAfter.produto.marca.nome, `Marca ${prefix} v2`);
});

test("REQ-REF-01: ADMIN cria categoria (201)", async () => {
  const res = await criarCategoria(
    req("/api/categorias", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Nova ${prefix}` },
    }),
  );
  assert.equal(res.status, 201);
});

test("REQ-REF-02: criar categoria com nome já existente responde 409", async () => {
  const res = await criarCategoria(
    req("/api/categorias", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Categoria ${prefix}` },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-REF-03: excluir categoria que tem produtos responde 409", async () => {
  const res = await excluirCategoria(
    req(`/api/categorias/${categoryId}`, {
      method: "DELETE",
      cookie: adminCookie,
    }),
    ctx(categoryId),
  );
  assert.equal(res.status, 409);
});

test("REQ-REF-04: criar marca para usuário CLIENTE é recusado; para MARCA é aceito", async () => {
  const client = await createUserDirectly(email("ref04-cliente"), "CLIENTE");
  const withoutBrand = await createUserDirectly(email("ref04-marca"), "MARCA");
  const res1 = await criarMarca(
    req("/api/marcas", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Marca inválida ${prefix}`, usuarioId: client.id },
    }),
  );
  assert.equal(res1.status, 409);

  const res2 = await criarMarca(
    req("/api/marcas", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Marca válida ${prefix}`, usuarioId: withoutBrand.id },
    }),
  );
  assert.equal(res2.status, 201);
});

test("REQ-PROD-03: atualizar produto inexistente responde 404", async () => {
  const res = await atualizarProduto(
    req("/api/produtos/99999999", {
      method: "PUT",
      cookie: adminCookie,
      body: { nome: "Não existe" },
    }),
    ctx(99999999),
  );
  assert.equal(res.status, 404);
});

test("REQ-PROD-05: PUT com certificadoIds atualiza o vínculo produto↔certificado", async () => {
  const product = await prisma.produto.create({
    data: { nome: `PROD05 ${prefix}`, preco: 10, categoriaId: categoryId, marcaId: brandId },
  });
  const cert1 = await prisma.certificado.create({
    data: { nome: `Certificado A ${prefix}`, orgaoEmissor: "Órgão A" },
  });
  const cert2 = await prisma.certificado.create({
    data: { nome: `Certificado B ${prefix}`, orgaoEmissor: "Órgão B" },
  });

  const res1 = await atualizarProduto(
    req(`/api/produtos/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [cert1.id, cert2.id] },
    }),
    ctx(product.id),
  );
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.deepEqual(
    body1.produto.certificados
      .map((pc: { certificadoId: number }) => pc.certificadoId)
      .sort(),
    [cert1.id, cert2.id].sort(),
  );

  // Substitui o vínculo: tira o cert2, mantém só o cert1
  const res2 = await atualizarProduto(
    req(`/api/produtos/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [cert1.id] },
    }),
    ctx(product.id),
  );
  const body2 = await res2.json();
  assert.deepEqual(
    body2.produto.certificados.map(
      (pc: { certificadoId: number }) => pc.certificadoId,
    ),
    [cert1.id],
  );

  // certificadoIds: [] remove todos
  const res3 = await atualizarProduto(
    req(`/api/produtos/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [] },
    }),
    ctx(product.id),
  );
  const body3 = await res3.json();
  assert.equal(body3.produto.certificados.length, 0);
});

test("REQ-PROD-05: certificadoId inexistente não é 500", async () => {
  const product = await prisma.produto.create({
    data: { nome: `PROD05b ${prefix}`, preco: 10, categoriaId: categoryId, marcaId: brandId },
  });
  const res = await atualizarProduto(
    req(`/api/produtos/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [99999999] },
    }),
    ctx(product.id),
  );
  assert.notEqual(res.status, 500);
  assert.ok([404, 409].includes(res.status));
});

test("REQ-PROD-04: criar ou atualizar produto com categoria/marca inexistente não é 500", async () => {
  const created = await criarProduto(
    req("/api/produtos", {
      method: "POST",
      cookie: adminCookie,
      body: {
        nome: `PROD04 ${prefix}`,
        preco: 10,
        categoriaId: 99999999,
        marcaId: brandId,
      },
    }),
  );
  assert.notEqual(created.status, 500);
  assert.ok([404, 409].includes(created.status));

  const existingProduct = await prisma.produto.findFirstOrThrow({
    where: { marcaId: brandId },
  });
  const updated = await atualizarProduto(
    req(`/api/produtos/${existingProduct.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { marcaId: 99999999 },
    }),
    ctx(existingProduct.id),
  );
  assert.notEqual(updated.status, 500);
  assert.ok([404, 409].includes(updated.status));
});
