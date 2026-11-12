# Tasks: 006-vinculo-produto-certificado

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | Failing tests: REQ-PROD-05 (full replacement, `[]` removes all, a nonexistent id is not 500) in `tests/integration/catalog.test.ts` | REQ-PROD-05 | — | the tests exist and fail (field ignored by the schema) | [x] |
| T2 | `lib/schemas/product.ts`: `certificadoIds` in `updateProductSchema` | REQ-PROD-05 | T1 | the schema accepts the field | [x] |
| T3 | `services/product.service.ts::updateProduct`: a transaction that replaces the link | REQ-PROD-05 | T2 | T1 passes | [x] |
| T4 | `types/api.ts`: `UpdateProductBody.certificadoIds` | REQ-PROD-05 | T3 | compiles | [x] |
| T5 | Dashboard: certificate checklist in the edit modal | REQ-PROD-05 | T4 | the code compiles (`tsc`), lint with no new error | [x] |
| T6 | Consolidate `gestao-de-produtos/{spec,status}.md`; remove the backlog row from `pendentes.md` | — | T1–T5 | `npm run sdd:check` passes | [x] |

## Note

REQ-PROD-05 stays ✅: the deciding logic (replacing the link, total removal, FK error) is in the API and covered by a real integration test against Postgres. The dashboard UI (certificate checklist) was not visually verified in the browser (unavailable in this session), but it only mirrors what the API already guarantees correctly.
