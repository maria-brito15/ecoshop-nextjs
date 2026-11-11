// Capacidade MIDIA — docs/capabilities/midia-de-produto/spec.md
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
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  GET as listarFotos,
  POST as uploadFoto,
  DELETE as deletarFoto,
} from "@/app/api/produtos/[id]/fotos/route";

/** Bytes que começam com a assinatura de um JPEG (REQ-MIDIA-06 valida o conteúdo, não só a extensão). */
const JPEG_VALIDO = (texto: string) =>
  Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(texto)]);

after(encerrar);

let produtoId = 0;
let adminCookie = "";
const prefixo = `Midia${RUN}`;
const arquivosCriados: string[] = [];

before(async () => {
  const admin = await criarUsuarioDireto(email("midia-admin"), "ADMIN");
  adminCookie = await cookieDe(admin);
  const dono = await criarUsuarioDireto(email("midia-marca"), "MARCA");
  const categoria = await prisma.categoria.create({
    data: { nome: `Categoria ${prefixo}` },
  });
  const marca = await prisma.marca.create({
    data: { nome: `Marca ${prefixo}`, usuarioId: dono.id },
  });
  const produto = await prisma.produto.create({
    data: {
      nome: `Produto ${prefixo}`,
      preco: 10,
      categoriaId: categoria.id,
      marcaId: marca.id,
    },
  });
  produtoId = produto.id;
});

// Limpa os arquivos reais gravados em public/data_fotos durante os testes.
after(async () => {
  for (const nome of arquivosCriados) {
    await fs
      .unlink(path.join(process.cwd(), "public/data_fotos", nome))
      .catch(() => {});
  }
});

const upload = (arquivo: File | null, nome?: string) => {
  const form = new FormData();
  if (arquivo) form.set("arquivo", arquivo);
  if (nome) form.set("nome", nome);
  return uploadFoto(
    req(`/api/produtos/${produtoId}/fotos`, {
      method: "POST",
      cookie: adminCookie,
      form,
    }),
    ctx(produtoId),
  );
};

test("REQ-MIDIA-01: upload de imagem válida fica acessível por URL", async () => {
  const arquivo = new File([JPEG_VALIDO("conteudo-fake-jpg")], "foto.jpg", {
    type: "image/jpeg",
  });
  const res = await upload(arquivo, `teste_${RUN}`);
  assert.equal(res.status, 201);
  const corpo = await res.json();
  assert.ok(corpo.foto.url.startsWith("/data_fotos/"));
  arquivosCriados.push(corpo.foto.nome);

  const lista = await (
    await listarFotos(req(`/api/produtos/${produtoId}/fotos`), ctx(produtoId))
  ).json();
  assert.ok(lista.fotos.some((f: { nome: string }) => f.nome === corpo.foto.nome));
});

test("REQ-MIDIA-02: arquivo que não é imagem permitida responde 400", async () => {
  const arquivo = new File(["não é imagem"], "documento.txt", {
    type: "text/plain",
  });
  const res = await upload(arquivo);
  assert.equal(res.status, 400);
});

test("REQ-MIDIA-02: arquivo acima do limite de 5MB responde 400", async () => {
  const grande = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
  const arquivo = new File([grande], "grande.jpg", { type: "image/jpeg" });
  const res = await upload(arquivo);
  assert.equal(res.status, 400);
});

test("REQ-MIDIA-03: remover uma foto apaga o arquivo e ela some da listagem", async () => {
  const arquivo = new File([JPEG_VALIDO("outra-foto")], "foto2.jpg", {
    type: "image/jpeg",
  });
  const enviada = await (await upload(arquivo, `remover_${RUN}`)).json();
  const nome = enviada.foto.nome;

  const res = await deletarFoto(
    req(`/api/produtos/${produtoId}/fotos?nome=${nome}`, {
      method: "DELETE",
      cookie: adminCookie,
    }),
    ctx(produtoId),
  );
  assert.equal(res.status, 200);

  const lista = await (
    await listarFotos(req(`/api/produtos/${produtoId}/fotos`), ctx(produtoId))
  ).json();
  assert.ok(!lista.fotos.some((f: { nome: string }) => f.nome === nome));

  await assert.rejects(
    fs.access(path.join(process.cwd(), "public/data_fotos", nome)),
  );
});
