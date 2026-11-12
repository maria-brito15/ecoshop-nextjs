/**
 * Spec 013: database (indexes and product deletion with links).
 * ALL of these tests need Postgres (they run in CI).
 */
import { email, createUserDirectly, cookieFor, req, ctx, closeConnections } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { DELETE as deleteProduct } from "@/app/api/products/[id]/route";
import { PUT as updateProduct } from "@/app/api/products/[id]/route";

after(closeConnections);

test("REQ-PROD-07: deleting a product that has a certificate returns 409 and keeps the product and link; after unlinking, it deletes", async () => {
  const admin = await cookieFor(await createUserDirectly(email("prod07-admin"), "ADMIN"));
  const owner = await createUserDirectly(email("prod07-owner"), "BRAND");
  const suffix = email("prod07");
  const category = await prisma.category.create({ data: { name: `Cat ${suffix}` } });
  const brand = await prisma.brand.create({ data: { name: `Brand ${suffix}`, userId: owner.id, status: "APPROVED" } });
  const certificate = await prisma.certificate.create({ data: { name: `Cert ${suffix}`, issuingBody: "Test" } });
  const product = await prisma.product.create({
    data: { name: `Product ${suffix}`, price: 10, categoryId: category.id, brandId: brand.id },
  });
  await prisma.productCertificate.create({ data: { productId: product.id, certificateId: certificate.id } });

  const blocked = await deleteProduct(req(`/api/products/${product.id}`, { method: "DELETE", cookie: admin }), ctx(product.id));
  assert.equal(blocked.status, 409);
  assert.ok(await prisma.product.findUnique({ where: { id: product.id } }), "the product still exists");
  assert.equal(await prisma.productCertificate.count({ where: { productId: product.id } }), 1, "the link still exists");

  const unlink = await updateProduct(
    req(`/api/products/${product.id}`, { method: "PUT", cookie: admin, body: { certificateIds: [] } }),
    ctx(product.id),
  );
  assert.equal(unlink.status, 200);
  const deleted = await deleteProduct(req(`/api/products/${product.id}`, { method: "DELETE", cookie: admin }), ctx(product.id));
  assert.equal(deleted.status, 200);
});

test("REQ-PROD-07: the index migration exists in the database (category, brand and certificate)", async () => {
  const indices = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
  const names = new Set(indices.map((i) => i.indexname));
  for (const expected of [
    "products_category_id_idx",
    "products_brand_id_idx",
    "product_certificates_certificate_id_idx",
  ]) {
    assert.ok(names.has(expected), `missing index ${expected}`);
  }
});
