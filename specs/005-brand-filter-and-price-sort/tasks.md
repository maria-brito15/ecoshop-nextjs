# Tasks: 005-brand-filter-and-price-sort

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | Failing tests: REQ-CAT-06 (cross-page sort, precoMax) and REQ-CAT-07 (marcaId) in `tests/integration/catalog.test.ts` | REQ-CAT-06, REQ-CAT-07 | — | the tests exist and fail (400/no effect, since the params do not exist yet) | [x] |
| T2 | `lib/schemas/product.ts`: `marcaId`, `precoMax`, `sort` in `listProductsQuerySchema` | REQ-CAT-06, REQ-CAT-07 | T1 | the schema accepts the 3 params | [x] |
| T3 | `services/product.service.ts::listProducts`: dynamic `where`/`orderBy` (`ORDER_BY_SORT`) | REQ-CAT-06, REQ-CAT-07 | T2 | T1 passes | [x] |
| T4 | `lib/hooks/useProducts.ts::useListProducts`: optional 5th parameter `filtros` | REQ-CAT-06, REQ-CAT-07 | T3 | compiles without breaking the 2 existing calls | [x] |
| T5 | `app/(store)/produtos/page.tsx`: removes client-side sort/filter; brand filter (desktop+mobile, only `APROVADA`); counters use `total`; page reset when changing sort/price | REQ-CAT-06, REQ-CAT-07 | T4 | the code compiles (`tsc`), lint with no new error | [x] |
| T6 | Consolidate `catalog/{spec,status}.md`; remove the backlog row from `pending.md` | — | T1–T5 | `npm run sdd:check` passes | [x] |

## Note

REQ-CAT-06/07 became ✅ (not ◐): unlike the earlier pure-UI changes, here the deciding logic (sorting, filtering, counting) is entirely in the API and covered by a real integration test against Postgres — it does not depend on a visual check in the browser to be correct. The only part not visually verified is the appearance of the new brand list in the sidebar, which is only presentation over data that is already correct.
