/**
 * Spec 013: banco de dados (índices e exclusão de produto com vínculos).
 * TODOS estes testes precisam de Postgres (rodam no CI).
 */
import { email, criarUsuarioDireto, cookieDe, req, ctx, encerrar } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { DELETE as excluirProduto } from "@/app/api/produtos/[id]/route";
import { PUT as atualizarProduto } from "@/app/api/produtos/[id]/route";

after(encerrar);

test("REQ-PROD-07: excluir produto que tem certificado responde 409 e mantém produto e vínculo; depois de desvincular, exclui", async () => {
  const admin = await cookieDe(await criarUsuarioDireto(email("prod07-admin"), "ADMIN"));
  const dono = await criarUsuarioDireto(email("prod07-dono"), "MARCA");
  const sufixo = email("prod07");
  const categoria = await prisma.categoria.create({ data: { nome: `Cat ${sufixo}` } });
  const marca = await prisma.marca.create({ data: { nome: `Marca ${sufixo}`, usuarioId: dono.id, status: "APROVADA" } });
  const certificado = await prisma.certificado.create({ data: { nome: `Cert ${sufixo}`, orgaoEmissor: "Teste" } });
  const produto = await prisma.produto.create({
    data: { nome: `Produto ${sufixo}`, preco: 10, categoriaId: categoria.id, marcaId: marca.id },
  });
  await prisma.produtoCertificado.create({ data: { produtoId: produto.id, certificadoId: certificado.id } });

  const bloqueado = await excluirProduto(req(`/api/produtos/${produto.id}`, { method: "DELETE", cookie: admin }), ctx(produto.id));
  assert.equal(bloqueado.status, 409);
  assert.ok(await prisma.produto.findUnique({ where: { id: produto.id } }), "o produto continua existindo");
  assert.equal(await prisma.produtoCertificado.count({ where: { produtoId: produto.id } }), 1, "o vínculo continua");

  const desvincular = await atualizarProduto(
    req(`/api/produtos/${produto.id}`, { method: "PUT", cookie: admin, body: { certificadoIds: [] } }),
    ctx(produto.id),
  );
  assert.equal(desvincular.status, 200);
  const excluido = await excluirProduto(req(`/api/produtos/${produto.id}`, { method: "DELETE", cookie: admin }), ctx(produto.id));
  assert.equal(excluido.status, 200);
});

test("REQ-PROD-07: a migration de índices existe no banco (categoria, marca e certificado)", async () => {
  const indices = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
  const nomes = new Set(indices.map((i) => i.indexname));
  for (const esperado of [
    "produtos_categoria_id_idx",
    "produtos_marca_id_idx",
    "produto_certificado_certificado_id_idx",
  ]) {
    assert.ok(nomes.has(esperado), `falta o índice ${esperado}`);
  }
});
