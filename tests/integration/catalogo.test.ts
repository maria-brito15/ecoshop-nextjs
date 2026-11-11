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
import {
  GET as detalhe,
  PUT as atualizarProduto,
} from "@/app/api/produtos/[id]/route";
import { POST as criarCategoria } from "@/app/api/categorias/route";
import { DELETE as excluirCategoria } from "@/app/api/categorias/[id]/route";
import { POST as criarMarca } from "@/app/api/marcas/route";
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

test("REQ-CAT-05: page ou size inválidos, ou size acima de 100, respondem 400", async () => {
  assert.equal((await listar(req("/api/produtos?size=1000"))).status, 400);
  assert.equal((await listar(req("/api/produtos?page=abc"))).status, 400);
  // o painel pede size=100 (caso-limite da spec): tem que continuar aceito
  assert.equal((await listar(req("/api/produtos?size=100"))).status, 200);
});

test("REQ-CAT-06: ordenar por preço aplica ao catálogo inteiro, não só à página", async () => {
  // Os 14 produtos do before() têm preço 10..23 (nome em ordem crescente também).
  const desc = await lista(`nome=${prefixo}&size=5&sort=preco_desc`);
  assert.equal(desc.total, 14);
  assert.equal(desc.produtos.length, 5);
  const precosDesc = desc.produtos.map((p: { preco: number }) => Number(p.preco));
  assert.deepEqual(precosDesc, [23, 22, 21, 20, 19]);

  const pagina2 = await lista(
    `nome=${prefixo}&size=5&page=2&sort=preco_desc`,
  );
  const precosPagina2 = pagina2.produtos.map((p: { preco: number }) =>
    Number(p.preco),
  );
  assert.deepEqual(precosPagina2, [18, 17, 16, 15, 14]);
});

test("REQ-CAT-06: precoMax limita o catálogo inteiro, não só a página", async () => {
  const r = await lista(`nome=${prefixo}&size=3&precoMax=15`);
  // preços 10..15 => 6 produtos no total, mesmo pedindo só 3 por página
  assert.equal(r.total, 6);
  assert.ok(
    r.produtos.every((p: { preco: number }) => Number(p.preco) <= 15),
  );
});

test("REQ-CAT-07: o filtro por marca devolve só produtos dela", async () => {
  const outroDono = await criarUsuarioDireto(email("cat07-marca"), "MARCA");
  const outraMarca = await prisma.marca.create({
    data: { nome: `Outra Marca ${prefixo}`, usuarioId: outroDono.id },
  });
  await prisma.produto.create({
    data: {
      nome: `Produto outra marca ${prefixo}`,
      preco: 99,
      categoriaId,
      marcaId: outraMarca.id,
    },
  });

  const r = await lista(`nome=${prefixo}&marcaId=${outraMarca.id}&size=50`);
  assert.equal(r.total, 1);
  assert.equal(r.produtos[0].marca.id, outraMarca.id);
});

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

test("REQ-PROD-02: renomear uma marca reflete no detalhe do produto sem esperar o TTL", async () => {
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
});

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

test("REQ-REF-02: criar categoria com nome já existente responde 409", async () => {
  const res = await criarCategoria(
    req("/api/categorias", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Categoria ${prefixo}` },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-REF-03: excluir categoria que tem produtos responde 409", async () => {
  const res = await excluirCategoria(
    req(`/api/categorias/${categoriaId}`, {
      method: "DELETE",
      cookie: adminCookie,
    }),
    ctx(categoriaId),
  );
  assert.equal(res.status, 409);
});

test("REQ-REF-04: criar marca para usuário CLIENTE é recusado; para MARCA é aceito", async () => {
  const cliente = await criarUsuarioDireto(email("ref04-cliente"), "CLIENTE");
  const semMarca = await criarUsuarioDireto(email("ref04-marca"), "MARCA");
  const res1 = await criarMarca(
    req("/api/marcas", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Marca inválida ${prefixo}`, usuarioId: cliente.id },
    }),
  );
  assert.equal(res1.status, 409);

  const res2 = await criarMarca(
    req("/api/marcas", {
      method: "POST",
      cookie: adminCookie,
      body: { nome: `Marca válida ${prefixo}`, usuarioId: semMarca.id },
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
  const produto = await prisma.produto.create({
    data: { nome: `PROD05 ${prefixo}`, preco: 10, categoriaId, marcaId },
  });
  const cert1 = await prisma.certificado.create({
    data: { nome: `Certificado A ${prefixo}`, orgaoEmissor: "Órgão A" },
  });
  const cert2 = await prisma.certificado.create({
    data: { nome: `Certificado B ${prefixo}`, orgaoEmissor: "Órgão B" },
  });

  const res1 = await atualizarProduto(
    req(`/api/produtos/${produto.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [cert1.id, cert2.id] },
    }),
    ctx(produto.id),
  );
  assert.equal(res1.status, 200);
  const corpo1 = await res1.json();
  assert.deepEqual(
    corpo1.produto.certificados
      .map((pc: { certificadoId: number }) => pc.certificadoId)
      .sort(),
    [cert1.id, cert2.id].sort(),
  );

  // Substitui o vínculo: tira o cert2, mantém só o cert1
  const res2 = await atualizarProduto(
    req(`/api/produtos/${produto.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [cert1.id] },
    }),
    ctx(produto.id),
  );
  const corpo2 = await res2.json();
  assert.deepEqual(
    corpo2.produto.certificados.map(
      (pc: { certificadoId: number }) => pc.certificadoId,
    ),
    [cert1.id],
  );

  // certificadoIds: [] remove todos
  const res3 = await atualizarProduto(
    req(`/api/produtos/${produto.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [] },
    }),
    ctx(produto.id),
  );
  const corpo3 = await res3.json();
  assert.equal(corpo3.produto.certificados.length, 0);
});

test("REQ-PROD-05: certificadoId inexistente não é 500", async () => {
  const produto = await prisma.produto.create({
    data: { nome: `PROD05b ${prefixo}`, preco: 10, categoriaId, marcaId },
  });
  const res = await atualizarProduto(
    req(`/api/produtos/${produto.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificadoIds: [99999999] },
    }),
    ctx(produto.id),
  );
  assert.notEqual(res.status, 500);
  assert.ok([404, 409].includes(res.status));
});

test("REQ-PROD-04: criar ou atualizar produto com categoria/marca inexistente não é 500", async () => {
  const criado = await criarProduto(
    req("/api/produtos", {
      method: "POST",
      cookie: adminCookie,
      body: {
        nome: `PROD04 ${prefixo}`,
        preco: 10,
        categoriaId: 99999999,
        marcaId,
      },
    }),
  );
  assert.notEqual(criado.status, 500);
  assert.ok([404, 409].includes(criado.status));

  const produtoExistente = await prisma.produto.findFirstOrThrow({
    where: { marcaId },
  });
  const atualizado = await atualizarProduto(
    req(`/api/produtos/${produtoExistente.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { marcaId: 99999999 },
    }),
    ctx(produtoExistente.id),
  );
  assert.notEqual(atualizado.status, 500);
  assert.ok([404, 409].includes(atualizado.status));
});
