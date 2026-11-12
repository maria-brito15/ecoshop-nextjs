# Change spec: 005-brand-filter-and-price-sort

- **Track:** fix (REQ-CAT-06/07 already existed in the spec; the server never actually implemented them — not a rule change)
- **Affected capabilities:** CAT (`docs/capabilities/catalog`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (feature chosen from the backlog on 2026-11-11) · **Date:** 2026-11-11

## Problem

`GET /api/produtos` does not accept `marcaId`, `precoMax` or `sort`. The `/produtos` screen simulated all three on the client: it sorted and filtered by price only the products of the page already paginated by the server (`produtosSorted`/`produtosFiltrados` over `data.produtos`), and had no brand filter at all. This directly violates REQ-CAT-06 ("apply to the whole catalog, not only to the displayed page") and leaves REQ-CAT-07 nonexistent.

## Out of scope

- Any other new filter (e.g. by certificate).
- Changing the page size (stays 12).
- Persisting the sort preference between sessions.

## Current behavior (fact, with evidence)

- `lib/schemas/product.ts` (`listProductsQuerySchema`): without `marcaId`, `precoMax`, `sort`.
- `services/product.service.ts::listProducts`: fixed `orderBy: { id: "asc" }`; `where` only filters `categoriaId`/`nome`.
- `app/(store)/produtos/page.tsx:270-283` (before the change): sorted and filtered by price with `Array.prototype.sort`/`.filter` over the 12 items already returned by the current page — and the "N products found" counter showed that local N, not the real total.
- `docs/capabilities/catalog/status.md`: REQ-CAT-06/07 ❌.

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-CAT-06 | When the visitor sorts by price or name, or caps the maximum price, the system shall apply the sort and the cap to the whole catalog, not only to the displayed page. | `GET /api/produtos?sort=preco_desc&size=5` → the 5 items are the 5 most expensive of the whole filtered set; page 2 keeps the same global ordering. `precoMax` changes the `total`, not only what is shown | Already existed (❌→✅) |
| REQ-CAT-07 | When the visitor filters by brand, the system shall return only its products. | `GET /api/produtos?marcaId=N` → only products of brand N | Already existed (❌→✅) |

## Scenarios and edge cases

- `sort` absent or `relevancia`: keeps the current behavior (`orderBy: id asc`).
- Invalid `sort` (outside the enum): 400 (the same Zod validation that already covers `page`/`size`).
- `precoMax` combined with `categoriaId`/`marcaId`/`nome`: all filters combine with `AND` (the same pattern already used by `categoriaId`/`nome`).
- ADMIN dashboard (`size=100`, without the new filters): keeps working unchanged, since all the new parameters are optional.
- Brand filter on the screen: only lists brands with `status === "APROVADA"` (ADR-0018) — a pending brand does not appear as a filter option in the public catalog.

## Business rules and constraints

- No new rule; BR-CAT-01 (positive decimal price) does not change.
- The filter and the sort are resolved by Prisma (`where`/`orderBy`), not in memory — that is what guarantees "whole catalog" instead of "current page".

## Affected interfaces

`GET /api/produtos` (query `marcaId`, `precoMax`, `sort`) · `lib/hooks/useProducts.ts` (`useListProducts` gains an optional 5th parameter) · `app/(store)/produtos/page.tsx` (brand filter in the UI; removes the client-side sort/filter).

## Delta in the living spec

`catalog/status.md`: REQ-CAT-06 ❌→✅, REQ-CAT-07 ❌→✅ (both with a test). `catalog/spec.md`: resolves the two open questions. `pending.md`: removes the brand filter/sort row from the backlog.

## Open questions

None blocking.
