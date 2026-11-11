// MIDIA capability — docs/capabilities/midia-de-produto/spec.md
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
  GET as listPhotos,
  POST as uploadPhoto,
  DELETE as deletePhoto,
} from "@/app/api/produtos/[id]/fotos/route";

/** Bytes that start with a JPEG signature (REQ-MIDIA-06 validates the content, not just the extension). */
const VALID_JPEG = (text: string) =>
  Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(text)]);

after(closeConnections);

let productId = 0;
let adminCookie = "";
const prefix = `Midia${RUN}`;
const createdFiles: string[] = [];

before(async () => {
  const admin = await createUserDirectly(email("midia-admin"), "ADMIN");
  adminCookie = await cookieDe(admin);
  const owner = await createUserDirectly(email("media-brand"), "MARCA");
  const category = await prisma.categoria.create({
    data: { nome: `Category ${prefix}` },
  });
  const brand = await prisma.marca.create({
    data: { nome: `Brand ${prefix}`, usuarioId: owner.id },
  });
  const product = await prisma.produto.create({
    data: {
      nome: `Product ${prefix}`,
      preco: 10,
      categoriaId: category.id,
      marcaId: brand.id,
    },
  });
  productId = product.id;
});

// Cleans up the real files written to public/data_fotos during the tests.
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
  return uploadPhoto(
    req(`/api/produtos/${productId}/fotos`, {
      method: "POST",
      cookie: adminCookie,
      form,
    }),
    ctx(productId),
  );
};

test("REQ-MIDIA-01: upload of a valid image is reachable by URL", async () => {
  const file = new File([VALID_JPEG("conteudo-fake-jpg")], "foto.jpg", {
    type: "image/jpeg",
  });
  const res = await upload(file, `teste_${RUN}`);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.foto.url.startsWith("/data_fotos/"));
  createdFiles.push(body.foto.nome);

  const list = await (
    await listPhotos(req(`/api/produtos/${productId}/fotos`), ctx(productId))
  ).json();
  assert.ok(list.fotos.some((f: { nome: string }) => f.nome === body.foto.nome));
});

test("REQ-MIDIA-02: a file that is not an allowed image returns 400", async () => {
  const file = new File(["not an image"], "documento.txt", {
    type: "text/plain",
  });
  const res = await upload(file);
  assert.equal(res.status, 400);
});

test("REQ-MIDIA-02: a file above the 5MB limit returns 400", async () => {
  const large = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
  const file = new File([large], "grande.jpg", { type: "image/jpeg" });
  const res = await upload(file);
  assert.equal(res.status, 400);
});

test("REQ-MIDIA-03: removing a photo deletes the file and it disappears from the list", async () => {
  const file = new File([VALID_JPEG("another-photo")], "foto2.jpg", {
    type: "image/jpeg",
  });
  const sent = await (await upload(file, `remover_${RUN}`)).json();
  const name = sent.foto.nome;

  const res = await deletePhoto(
    req(`/api/produtos/${productId}/fotos?nome=${name}`, {
      method: "DELETE",
      cookie: adminCookie,
    }),
    ctx(productId),
  );
  assert.equal(res.status, 200);

  const list = await (
    await listPhotos(req(`/api/produtos/${productId}/fotos`), ctx(productId))
  ).json();
  assert.ok(!list.fotos.some((f: { nome: string }) => f.nome === name));

  await assert.rejects(
    fs.access(path.join(process.cwd(), "public/data_fotos", name)),
  );
});
