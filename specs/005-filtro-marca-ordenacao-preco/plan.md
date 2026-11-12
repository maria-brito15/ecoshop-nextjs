# Plan: 005-filtro-marca-ordenacao-preco

- **Spec:** ./spec.md
- **ADRs it follows:** ADR-0018 (brand status — only APROVADA brands appear in the filter) · **New ADRs / ones it supersedes:** none

## Technical approach

Everything resolved in the database (Prisma), not in memory:
1. `lib/schemas/product.ts`: `listProductsQuerySchema` gains `marcaId` (coerce number), `precoMax` (coerce positive number) and `sort` (enum `relevancia|preco_asc|preco_desc|nome_asc|nome_desc`, default `relevancia`).
2. `services/product.service.ts::listProducts`: `where` gains `marcaId`/`preco: { lte: precoMax }` when present; `orderBy` becomes a fixed map (`ORDER_BY_SORT`) indexed by `sort`, instead of the fixed `{ id: "asc" }`. `skip`/`take` stay in Prisma, so the sort/filter applies to the count (`total`) and to any page.
3. `app/api/produtos/route.ts`: documentation only (the validation and the passing of `searchParams` were already generic).
4. `lib/hooks/useProducts.ts::useListProducts`: optional 5th parameter `filtros: { marcaId?, precoMax?, sort? }`, so as not to break the two existing calls that only use `(page, size)`.
5. `app/(store)/produtos/page.tsx`: removes `produtosSorted`/`produtosFiltrados` (client-side sort/filter); passes `marcaId`/`precoMax`/`sort` to the hook; the "N products found" counters now use `total` (from the server) instead of the size of the page array; a new brand filter block (desktop and mobile), only with brands `status === "APROVADA"` (ADR-0018); changing `sort`/price resets the page to 1 (avoids an empty page after a filter reduces the total).

Discarded alternative: keep sorting/filtering on the client, but over `size=100` (ask for everything at once). Rejected: it multiplies the payload per page even without need, and would still require manual pagination on the client — more code for the same result that Prisma already does for free.

## Constitution Check

| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | yes | REQ-CAT-06 (2 tests: cross-page sort, precoMax) and REQ-CAT-07 (1 test) |
| V Layers | yes | yes | handler calls `services/`; filter/sort stay in the service |
| XI No invented data | yes | yes | the brand filter only lists real, approved brands |

## Affected files

| File | Change | REQ |
|---|---|---|
| `lib/schemas/product.ts` | `marcaId`, `precoMax`, `sort` in `listProductsQuerySchema` | REQ-CAT-06, REQ-CAT-07 |
| `services/product.service.ts` | dynamic `where`/`orderBy` | REQ-CAT-06, REQ-CAT-07 |
| `app/api/produtos/route.ts` | docs of the new query params | REQ-CAT-06, REQ-CAT-07 |
| `lib/hooks/useProducts.ts` | `useListProducts` gains an optional `filtros` | REQ-CAT-06, REQ-CAT-07 |
| `app/(store)/produtos/page.tsx` | removes client-side sort/filter; brand filter in the UI; counters use `total` | REQ-CAT-06, REQ-CAT-07 |
| `tests/integration/catalog.test.ts` | 3 new tests | REQ-CAT-06, REQ-CAT-07 |
| `docs/capabilities/catalogo/{spec,status}.md` | REQ-CAT-06/07 ❌→✅ | REQ-CAT-06, REQ-CAT-07 |
| `docs/architecture/adr/pendentes.md` | removes the backlog row | — |

## Verification plan

Integration (`tests/integration/catalog.test.ts`): REQ-CAT-06 with `sort=preco_desc` on two pages (`size=5`, pages 1 and 2) confirming a continuous descending order across the 14 products; REQ-CAT-06 with `precoMax=15` confirming `total=6` even with `size=3`; REQ-CAT-07 with a second brand and a product exclusive to it. REQ-CAT-01 to 05 and REQ-PROD-01/02 keep passing unchanged (non-regression). Manual: not done (no browser in this session) — but the UI logic is testable by reading the code, since all the filter/sort decision migrated to the API, already covered by a test.

## Risks and rollback

Risk: `precoMax`/`sort`/`marcaId` combined with the cache (`productKey`) generating inconsistent keys. Mitigated: `productKey` already serializes `searchParams.toString()` generically, including any new parameter automatically — no change needed in `lib/cache/keys.ts`. Rollback: revert `services/product.service.ts` and `lib/schemas/product.ts` to the fixed `where`/`orderBy`; the UI and the hook tolerate the absence of these parameters (they are all optional).

## Complexity Tracking

No violations.
