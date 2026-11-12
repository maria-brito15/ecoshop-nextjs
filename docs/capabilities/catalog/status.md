# CAT · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-CAT-01 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-02 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-03 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-04 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-05 | ✅ | test: tests/integration/catalog.test.ts (fixed D9: lib/schemas/product.ts has listProductsQuerySchema, validated in app/api/products/route.ts) | 2026-11-10 |
| REQ-CAT-06 | ✅ | test: tests/integration/catalog.test.ts (sort and maxPrice applied in the database, confirmed across pages) | 2026-11-11 |
| REQ-CAT-07 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-11 |
| REQ-CAT-08 | ◐ | code: services/product.service.ts (getProduct includes certificates); no test | 2026-11-10 |
| REQ-CAT-09 | ✅ | test: tests/integration/input-and-errors.test.ts | 2026-11-11 |
| REQ-CAT-10 | ✅ | test: tests/integration/redis-and-cache.test.ts (stable key, distinct filters, normalized name, 400 above 100). The listing's database path **was not re-run** (catalog.test.ts needs a database) | 2026-11-11 |
