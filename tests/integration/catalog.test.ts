// CAT, PROD and REF capabilities — docs/capabilities/{catalog,product-management,reference-data}
import {
  RUN,
  email,
  createUserDirectly,
  cookieFor,
  req,
  ctx,
  closeConnections,
} from "./helpers";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { GET as listProductsRoute, POST as createProduct } from "@/app/api/products/route";
import {
  GET as detail,
  PUT as updateProduct,
} from "@/app/api/products/[id]/route";
import { POST as createCategory } from "@/app/api/categories/route";
import { DELETE as deleteCategory } from "@/app/api/categories/[id]/route";
import { POST as createBrand } from "@/app/api/brands/route";
import { PUT as updateBrand } from "@/app/api/brands/[id]/route";

after(async () => {
  await closeConnections();
});

let categoryId = 0;
let brandId = 0;
let adminCookie = "";
const prefix = `Cat${RUN}`;

before(async () => {
  const admin = await createUserDirectly(email("cat-admin"), "ADMIN");
  adminCookie = await cookieFor(admin);
  const owner = await createUserDirectly(email("cat-brand"), "BRAND");
  const category = await prisma.category.create({
    data: { name: `Category ${prefix}` },
  });
  const brand = await prisma.brand.create({
    data: { name: `Brand ${prefix}`, userId: owner.id },
  });
  categoryId = category.id;
  brandId = brand.id;
  await prisma.product.createMany({
    data: Array.from({ length: 14 }, (_, i) => ({
      name: `Product ${prefix} ${String(i).padStart(2, "0")}`,
      price: 10 + i,
      categoryId,
      brandId,
    })),
  });
});

const list = async (query: string) =>
  (await listProductsRoute(req(`/api/products?${query}`))).json();

test("REQ-CAT-01: the catalog lists 12 products per page, with the total number of results", async () => {
  const p1 = await list(`name=${prefix}`);
  assert.equal(p1.total, 14);
  assert.equal(p1.products.length, 12);
  assert.equal(p1.page, 1);
  const p2 = await list(`name=${prefix}&page=2`);
  assert.equal(p2.products.length, 2);
});

test("REQ-CAT-02: name search is case-insensitive", async () => {
  const r = await list(`name=${prefix.toUpperCase()}`);
  assert.equal(r.total, 14);
});

test("REQ-CAT-03: the category filter returns only its products", async () => {
  const r = await list(`categoryId=${categoryId}&size=50`);
  assert.equal(r.total, 14);
  assert.ok(
    r.products.every(
      (p: { category: { id: number } }) => p.category.id === categoryId,
    ),
  );
});

test("REQ-CAT-04: unknown product returns 404", async () => {
  assert.equal(
    (await detail(req("/api/products/99999999"), ctx(99999999))).status,
    404,
  );
});

test("REQ-CAT-05: invalid page or size, or size above 100, return 400", async () => {
  assert.equal((await listProductsRoute(req("/api/products?size=1000"))).status, 400);
  assert.equal((await listProductsRoute(req("/api/products?page=abc"))).status, 400);
  // the panel asks for size=100 (spec edge case): it must remain accepted
  assert.equal((await listProductsRoute(req("/api/products?size=100"))).status, 200);
});

test("REQ-CAT-06: sorting by price applies to the whole catalog, not just the page", async () => {
  // The 14 products from before() have prices 10..23 (name in ascending order too).
  const desc = await list(`name=${prefix}&size=5&sort=price_desc`);
  assert.equal(desc.total, 14);
  assert.equal(desc.products.length, 5);
  const pricesDesc = desc.products.map((p: { price: number }) => Number(p.price));
  assert.deepEqual(pricesDesc, [23, 22, 21, 20, 19]);

  const page2 = await list(
    `name=${prefix}&size=5&page=2&sort=price_desc`,
  );
  const page2Prices = page2.products.map((p: { price: number }) =>
    Number(p.price),
  );
  assert.deepEqual(page2Prices, [18, 17, 16, 15, 14]);
});

test("REQ-CAT-06: maxPrice limits the whole catalog, not just the page", async () => {
  const r = await list(`name=${prefix}&size=3&maxPrice=15`);
  // prices 10..15 => 6 products in total, even when asking for only 3 per page
  assert.equal(r.total, 6);
  assert.ok(
    r.products.every((p: { price: number }) => Number(p.price) <= 15),
  );
});

test("REQ-CAT-07: the brand filter returns only its products", async () => {
  const otherOwner = await createUserDirectly(email("cat07-brand"), "BRAND");
  const otherBrand = await prisma.brand.create({
    data: { name: `Other Brand ${prefix}`, userId: otherOwner.id },
  });
  await prisma.product.create({
    data: {
      name: `Product other brand ${prefix}`,
      price: 99,
      categoryId,
      brandId: otherBrand.id,
    },
  });

  const r = await list(`name=${prefix}&brandId=${otherBrand.id}&size=50`);
  assert.equal(r.total, 1);
  assert.equal(r.products[0].brand.id, otherBrand.id);
});

test("REQ-PROD-01: a product created by ADMIN shows up in the catalog right away (cache invalidated)", async () => {
  const name = `New ${prefix}`;
  assert.equal((await list(`name=${encodeURIComponent(name)}`)).total, 0);
  const res = await createProduct(
    req("/api/products", {
      method: "POST",
      cookie: adminCookie,
      body: { name, price: 25.5, categoryId, brandId },
    }),
  );
  assert.equal(res.status, 201);
  assert.equal((await list(`name=${encodeURIComponent(name)}`)).total, 1);
});

test("REQ-PROD-02: renaming a brand is reflected in the product detail without waiting for the TTL", async () => {
  const product = await prisma.product.findFirstOrThrow({
    where: { brandId },
  });
  const detailBefore = await (
    await detail(req(`/api/products/${product.id}`), ctx(product.id))
  ).json();
  assert.equal(detailBefore.product.brand.name, `Brand ${prefix}`);
  await updateBrand(
    req(`/api/brands/${brandId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { name: `Brand ${prefix} v2` },
    }),
    ctx(brandId),
  );
  const detailAfter = await (
    await detail(req(`/api/products/${product.id}`), ctx(product.id))
  ).json();
  assert.equal(detailAfter.product.brand.name, `Brand ${prefix} v2`);
});

test("REQ-REF-01: ADMIN creates a category (201)", async () => {
  const res = await createCategory(
    req("/api/categories", {
      method: "POST",
      cookie: adminCookie,
      body: { name: `New ${prefix}` },
    }),
  );
  assert.equal(res.status, 201);
});

test("REQ-REF-02: creating a category with an existing name returns 409", async () => {
  const res = await createCategory(
    req("/api/categories", {
      method: "POST",
      cookie: adminCookie,
      body: { name: `Category ${prefix}` },
    }),
  );
  assert.equal(res.status, 409);
});

test("REQ-REF-03: deleting a category that has products returns 409", async () => {
  const res = await deleteCategory(
    req(`/api/categories/${categoryId}`, {
      method: "DELETE",
      cookie: adminCookie,
    }),
    ctx(categoryId),
  );
  assert.equal(res.status, 409);
});

test("REQ-REF-04: creating a brand for a CUSTOMER user is refused; for BRAND it is accepted", async () => {
  const client = await createUserDirectly(email("ref04-customer"), "CUSTOMER");
  const withoutBrand = await createUserDirectly(email("ref04-brand"), "BRAND");
  const res1 = await createBrand(
    req("/api/brands", {
      method: "POST",
      cookie: adminCookie,
      body: { name: `Invalid brand ${prefix}`, userId: client.id },
    }),
  );
  assert.equal(res1.status, 409);

  const res2 = await createBrand(
    req("/api/brands", {
      method: "POST",
      cookie: adminCookie,
      body: { name: `Valid brand ${prefix}`, userId: withoutBrand.id },
    }),
  );
  assert.equal(res2.status, 201);
});

test("REQ-PROD-03: updating an unknown product returns 404", async () => {
  const res = await updateProduct(
    req("/api/products/99999999", {
      method: "PUT",
      cookie: adminCookie,
      body: { name: "Does not exist" },
    }),
    ctx(99999999),
  );
  assert.equal(res.status, 404);
});

test("REQ-PROD-05: PUT with certificateIds updates the product↔certificate link", async () => {
  const product = await prisma.product.create({
    data: { name: `PROD05 ${prefix}`, price: 10, categoryId, brandId },
  });
  const cert1 = await prisma.certificate.create({
    data: { name: `Certificate A ${prefix}`, issuingBody: "Body A" },
  });
  const cert2 = await prisma.certificate.create({
    data: { name: `Certificate B ${prefix}`, issuingBody: "Body B" },
  });

  const res1 = await updateProduct(
    req(`/api/products/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificateIds: [cert1.id, cert2.id] },
    }),
    ctx(product.id),
  );
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.deepEqual(
    body1.product.certificates
      .map((pc: { certificateId: number }) => pc.certificateId)
      .sort(),
    [cert1.id, cert2.id].sort(),
  );

  // Replaces the link: removes cert2, keeps only cert1
  const res2 = await updateProduct(
    req(`/api/products/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificateIds: [cert1.id] },
    }),
    ctx(product.id),
  );
  const body2 = await res2.json();
  assert.deepEqual(
    body2.product.certificates.map(
      (pc: { certificateId: number }) => pc.certificateId,
    ),
    [cert1.id],
  );

  // certificateIds: [] removes all of them
  const res3 = await updateProduct(
    req(`/api/products/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificateIds: [] },
    }),
    ctx(product.id),
  );
  const body3 = await res3.json();
  assert.equal(body3.product.certificates.length, 0);
});

test("REQ-PROD-05: an unknown certificateId is not a 500", async () => {
  const product = await prisma.product.create({
    data: { name: `PROD05b ${prefix}`, price: 10, categoryId, brandId },
  });
  const res = await updateProduct(
    req(`/api/products/${product.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { certificateIds: [99999999] },
    }),
    ctx(product.id),
  );
  assert.notEqual(res.status, 500);
  assert.ok([404, 409].includes(res.status));
});

test("REQ-PROD-04: creating or updating a product with an unknown category/brand is not a 500", async () => {
  const created = await createProduct(
    req("/api/products", {
      method: "POST",
      cookie: adminCookie,
      body: {
        name: `PROD04 ${prefix}`,
        price: 10,
        categoryId: 99999999,
        brandId,
      },
    }),
  );
  assert.notEqual(created.status, 500);
  assert.ok([404, 409].includes(created.status));

  const existingProduct = await prisma.product.findFirstOrThrow({
    where: { brandId },
  });
  const updated = await updateProduct(
    req(`/api/products/${existingProduct.id}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { brandId: 99999999 },
    }),
    ctx(existingProduct.id),
  );
  assert.notEqual(updated.status, 500);
  assert.ok([404, 409].includes(updated.status));
});
