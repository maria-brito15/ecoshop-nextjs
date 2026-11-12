# PROD · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-PROD-01 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-PROD-02 | ✅ | test: tests/integration/catalog.test.ts (fixed: category.service.ts and brand.service.ts also invalidate PRODUTOS) | 2026-11-10 |
| REQ-PROD-03 | ✅ | test: tests/integration/catalog.test.ts (fixed: PUT uses mapError, lib/http/responses.ts) | 2026-11-10 |
| REQ-PROD-04 | ✅ | test: tests/integration/catalog.test.ts (P2003 mapped to 409 via mapError) | 2026-11-10 |
| REQ-PROD-05 | ✅ | test: tests/integration/catalog.test.ts (PUT with certificateIds replaces the link; `[]` removes all; nonexistent id is not 500) | 2026-11-11 |
| REQ-PROD-06 | ✅ | test: tests/integration/input-and-errors.test.ts (valid body, so that only the id explains the 400) | 2026-11-11 |
| REQ-PROD-07 | ✅ | test: tests/integration/database.test.ts (ran on 2026-11-12 against a Postgres built from the single English `init`: FK `ON DELETE RESTRICT` blocks the deletion with 409, deletion works after unlinking, and the key indexes `products_category_id_idx`, `products_brand_id_idx` and `product_certificates_certificate_id_idx` exist); the error mapper converts P2003 into 409. Wrong comment about "cascade" fixed in `product.service.ts` | 2026-11-12 |
