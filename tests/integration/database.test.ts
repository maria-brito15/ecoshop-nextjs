/**
 * Spec 013: database (indexes and product deletion with links).
 * ALL of these tests need Postgres (they run in CI).
 */
import { email, createUserDirectly, cookieDe, req, ctx, closeConnections } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { DELETE as excluirProduto } from "@/app/api/produtos/[id]/route";
import { PUT as atualizarProduto } from "@/app/api/produtos/[id]/route";

after(closeConnections);

test("REQ-PROD-07: deleting a product that has a certificate returns 409 and keeps the product and link; after unlinking, it deletes", async () => {
  const admin = await cookieDe(await createUserDirectly(email("prod07-admin"), "ADMIN"));
  const owner = await createUserDirectly(email("prod07-dono"), "MARCA");
  const suffix = email("prod07");
  const category = await prisma.categoria.create({ data: { nome: `Cat ${suffix}` } });
  const brand = await prisma.marca.create({ data: { nome: `Brand ${suffix}`, usuarioId: owner.id, status: "APROVADA" } });
  const certificate = await prisma.certificado.create({ data: { nome: `Cert ${suffix}`, orgaoEmissor: "Teste" } });
  const product = await prisma.produto.create({
    data: { nome: `Product ${suffix}`, preco: 10, categoriaId: category.id, marcaId: brand.id },
  });
  await prisma.produtoCertificado.create({ data: { produtoId: product.id, certificadoId: certificate.id } });

  const blocked = await excluirProduto(req(`/api/produtos/${product.id}`, { method: "DELETE", cookie: admin }), ctx(product.id));
  assert.equal(blocked.status, 409);
  assert.ok(await prisma.produto.findUnique({ where: { id: product.id } }), "the product still exists");
  assert.equal(await prisma.produtoCertificado.count({ where: { produtoId: product.id } }), 1, "the link still exists");

  const unlink = await atualizarProduto(
    req(`/api/produtos/${product.id}`, { method: "PUT", cookie: admin, body: { certificadoIds: [] } }),
    ctx(product.id),
  );
  assert.equal(unlink.status, 200);
  const deleted = await excluirProduto(req(`/api/produtos/${product.id}`, { method: "DELETE", cookie: admin }), ctx(product.id));
  assert.equal(deleted.status, 200);
});

test("REQ-PROD-07: the index migration exists in the database (category, brand and certificate)", async () => {
  const indices = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
  const names = new Set(indices.map((i) => i.indexname));
  for (const expected of [
    "produtos_categoria_id_idx",
    "produtos_marca_id_idx",
    "produto_certificado_certificado_id_idx",
  ]) {
    assert.ok(names.has(expected), `missing index ${expected}`);
  }
});
