# Plan: 006-vinculo-produto-certificado

- **Spec:** ./spec.md
- **ADRs it follows:** none specific · **New ADRs / ones it supersedes:** none

## Technical approach

1. `lib/schemas/product.ts`: `updateProductSchema` gains `certificadoIds?: number[]` (an array of integers, optional).
2. `services/product.service.ts::updateProduct`: separates `certificadoIds` from the rest of the body (`produtoData`). Inside a `prisma.$transaction`: updates the scalar fields (if there are any) or only confirms that the product exists (`findUniqueOrThrow`, guarantees 404 even when only `certificadoIds` is sent); if `certificadoIds !== undefined`, removes the whole current link (`produtoCertificado.deleteMany`) and creates the new one, deduplicated (`produtoCertificado.createMany`); returns the product with `certificados` included.
3. `app/api/produtos/[id]/route.ts`: documentation only — the validation and the pass-through to the service were already generic.
4. `types/api.ts`: `UpdateProductBody` gains `certificadoIds?: number[]`.
5. Dashboard (`app/(admin)/painel/page.tsx`, `ProductsSection`): a `certificadoIds` state; when opening "Edit", it pre-checks the already linked certificates (`produto.certificados.map(pc => pc.certificado.id)`); the certificate checklist is visible only in edit mode (creation has no product yet); `handleSave` sends `certificadoIds` only on the PUT.

Discarded alternative: a dedicated endpoint (`POST/DELETE /api/produtos/{id}/certificados`). Rejected because the acceptance criterion already requested by the owner is explicitly "PUT with certificadoIds updates the link" — a new endpoint would be scope beyond the request.

## Constitution Check

| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | yes | REQ-PROD-05: full replacement, total removal (`[]`), and a nonexistent id is not 500 |
| V Layers | yes | yes | handler calls `services/`; the transaction stays in the service |
| VII Errors | yes | yes | a nonexistent `certificadoId` mapped to 409 (`mapError`, P2003), not 500 |

## Affected files

| File | Change | REQ |
|---|---|---|
| `lib/schemas/product.ts` | `certificadoIds` in `updateProductSchema` | REQ-PROD-05 |
| `services/product.service.ts` | `updateProduct` replaces the link in a transaction | REQ-PROD-05 |
| `app/api/produtos/[id]/route.ts` | docs of the new field | REQ-PROD-05 |
| `types/api.ts` | `UpdateProductBody.certificadoIds` | REQ-PROD-05 |
| `app/(admin)/painel/page.tsx` | certificate checklist in the product edit modal | REQ-PROD-05 |
| `tests/integration/catalog.test.ts` | 2 new tests | REQ-PROD-05 |
| `docs/capabilities/gestao-de-produtos/{spec,status}.md` | REQ-PROD-05 ❌→✅ | REQ-PROD-05 |
| `docs/architecture/adr/pendentes.md` | removes the backlog row | — |

## Verification plan

Integration (`tests/integration/catalog.test.ts`): replace the link (2 certificates → 1 → none) and confirm the array returned at each step; a nonexistent `certificadoId` does not produce 500. REQ-PROD-01 to 04 keep passing unchanged. Manual: not done (no browser in this session), but the deciding logic is in the API, covered by a test; the UI only reflects what the API already does.

## Risks and rollback

Risk: the transaction being partially applied if creation fails midway through `createMany`. Mitigated by `$transaction` itself (Postgres atomicity — if `createMany` fails on an FK, the earlier `deleteMany` is also rolled back). Rollback: remove `certificadoIds` from the schema and the service (the column/table does not change, it just stops being editable through the API).

## Complexity Tracking

No violations.
