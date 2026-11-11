// Capacidade MIDIA — docs/capabilities/midia-de-produto/spec.md
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
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  GET as listarFotos,
  POST as uploadFoto,
  DELETE as deletarFoto,
} from "@/app/api/produtos/[id]/fotos/route";

/** Bytes que começam com a assinatura de um JPEG (REQ-MIDIA-06 valida o conteúdo, não só a extensão). */
const JPEG_VALIDO = (text: string) =>
  Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(text)]);

after(closeConnections);

let productId = 0;
let adminCookie = "";
const prefixo = `Midia${RUN}`;
const createdFiles: string[] = [];

before(async () => {
  const admin = await createUserDirectly(email("midia-admin"), "ADMIN");
  adminCookie = await cookieDe(admin);
  const dono = await createUserDirectly(email("midia-marca"), "MARCA");
  const category = await prisma.categoria.create({
    data: { nome: `Categoria ${prefixo}` },
  });
  const brand = await prisma.marca.create({
    data: { nome: `Marca ${prefixo}`, usuarioId: dono.id },
  });
  const product = await prisma.produto.create({
    data: {
      nome: `Produto ${prefixo}`,
      preco: 10,
      categoriaId: category.id,
      marcaId: brand.id,
    },
  });
  productId = product.id;
});

// Limpa os arquivos reais gravados em public/data_fotos durante os testes.
after(async () => {
  for (const name of createdFiles) {
    await fs
      .unlink(path.join(process.cwd(), "public/data_fotos", name))
      .catch(() => {});
  }
});

const upload = (file: File | null, name?: string) => {
  const form = new FormData();
  if (file) form.set("arquivo", file);
  if (name) form.set("nome", name);
  return uploadFoto(
    req(`/api/produtos/${productId}/fotos`, {
      method: "POST",
      cookie: adminCookie,
      form,
    }),
    ctx(productId),
  );
};

test("REQ-MIDIA-01: upload de imagem válida fica acessível por URL", async () => {
  const file = new File([JPEG_VALIDO("conteudo-fake-jpg")], "foto.jpg", {
    type: "image/jpeg",
  });
  const res = await upload(file, `teste_${RUN}`);
  assert.equal(res.status, 201);
  const corpo = await res.json();
  assert.ok(corpo.foto.url.startsWith("/data_fotos/"));
  createdFiles.push(corpo.foto.nome);

  const list = await (
    await listarFotos(req(`/api/produtos/${productId}/fotos`), ctx(productId))
  ).json();
  assert.ok(list.fotos.some((f: { nome: string }) => f.nome === corpo.foto.nome));
});

test("REQ-MIDIA-02: arquivo que não é imagem permitida responde 400", async () => {
  const file = new File(["não é imagem"], "documento.txt", {
    type: "text/plain",
  });
  const res = await upload(file);
  assert.equal(res.status, 400);
});

test("REQ-MIDIA-02: arquivo acima do limite de 5MB responde 400", async () => {
  const grande = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
  const file = new File([grande], "grande.jpg", { type: "image/jpeg" });
  const res = await upload(file);
  assert.equal(res.status, 400);
});

test("REQ-MIDIA-03: remover uma foto apaga o arquivo e ela some da listagem", async () => {
  const file = new File([JPEG_VALIDO("outra-foto")], "foto2.jpg", {
    type: "image/jpeg",
  });
  const enviada = await (await upload(file, `remover_${RUN}`)).json();
  const name = enviada.foto.nome;

  const res = await deletarFoto(
    req(`/api/produtos/${productId}/fotos?nome=${name}`, {
      method: "DELETE",
      cookie: adminCookie,
    }),
    ctx(productId),
  );
  assert.equal(res.status, 200);

  const list = await (
    await listarFotos(req(`/api/produtos/${productId}/fotos`), ctx(productId))
  ).json();
  assert.ok(!list.fotos.some((f: { nome: string }) => f.nome === name));

  await assert.rejects(
    fs.access(path.join(process.cwd(), "public/data_fotos", name)),
  );
});
