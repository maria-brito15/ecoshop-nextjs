/**
 * Spec 013: banco de dados (índices e exclusão de produto com vínculos).
 * TODOS estes testes precisam de Postgres (rodam no CI).
 */
import { email, createUserDirectly, cookieDe, req, ctx, closeConnections } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { DELETE as excluirProduto } from "@/app/api/produtos/[id]/route";
import { PUT as atualizarProduto } from "@/app/api/produtos/[id]/route";

after(closeConnections);

test("REQ-PROD-07: excluir produto que tem certificado responde 409 e mantém produto e vínculo; depois de desvincular, exclui", async () => {
  const admin = await cookieDe(await createUserDirectly(email("prod07-admin"), "ADMIN"));
  const owner = await createUserDirectly(email("prod07-dono"), "MARCA");
  const suffix = email("prod07");
  const category = await prisma.categoria.create({ data: { nome: `Cat ${suffix}` } });
  const brand = await prisma.marca.create({ data: { nome: `Marca ${suffix}`, usuarioId: owner.id, status: "APROVADA" } });
  const certificate = await prisma.certificado.create({ data: { nome: `Cert ${suffix}`, orgaoEmissor: "Teste" } });
  const product = await prisma.produto.create({
    data: { nome: `Produto ${suffix}`, preco: 10, categoriaId: category.id, marcaId: brand.id },
  });
  await prisma.produtoCertificado.create({ data: { produtoId: product.id, certificadoId: certificate.id } });

  const blocked = await excluirProduto(req(`/api/produtos/${product.id}`, { method: "DELETE", cookie: admin }), ctx(product.id));
  assert.equal(blocked.status, 409);
  assert.ok(await prisma.produto.findUnique({ where: { id: product.id } }), "o produto continua existindo");
  assert.equal(await prisma.produtoCertificado.count({ where: { produtoId: product.id } }), 1, "o vínculo continua");

  const unlink = await atualizarProduto(
    req(`/api/produtos/${product.id}`, { method: "PUT", cookie: admin, body: { certificadoIds: [] } }),
    ctx(product.id),
  );
  assert.equal(unlink.status, 200);
  const deleted = await excluirProduto(req(`/api/produtos/${product.id}`, { method: "DELETE", cookie: admin }), ctx(product.id));
  assert.equal(deleted.status, 200);
});

test("REQ-PROD-07: a migration de índices existe no banco (categoria, marca e certificado)", async () => {
  const indices = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
  const names = new Set(indices.map((i) => i.indexname));
  for (const expected of [
    "produtos_categoria_id_idx",
    "produtos_marca_id_idx",
    "produto_certificado_certificado_id_idx",
  ]) {
    assert.ok(names.has(expected), `falta o índice ${expected}`);
  }
});
