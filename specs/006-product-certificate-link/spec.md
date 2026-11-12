# Change spec: 006-product-certificate-link

- **Track:** fix (REQ-PROD-05 already existed in the spec with a defined acceptance criterion; the server never implemented it)
- **Affected capabilities:** PROD (`docs/capabilities/product-management`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (feature chosen from the backlog on 2026-11-11) · **Date:** 2026-11-11

## Problem

`PUT /api/produtos/[id]` does not accept any field related to certificates. The `ProdutoCertificado` link is only filled by the seed (`prisma/seed.ts`); there is no way for an ADMIN to associate or remove certificates of an existing product through the API or the dashboard.

## Out of scope

- Creating/editing certificates themselves (already exists, `app/api/certificados`).
- Linking a certificate at product creation (`POST /api/produtos`) — REQ-PROD-05 speaks of "edits a product", and the product must exist to have the link; creation stays without this field.
- Any "certificate required per category" rule or similar — not requested.

## Current behavior (fact, with evidence)

- `lib/schemas/product.ts` (`updateProductSchema`): without `certificadoIds`.
- `services/product.service.ts::updateProduct`: only passes the product's scalar fields to Prisma.
- `prisma/seed.ts`: the only place that creates rows in `ProdutoCertificado`.
- `docs/capabilities/product-management/status.md`: REQ-PROD-05 (implicit, without a row of its own — see the note).

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-PROD-05 | When an ADMIN edits a product, the system shall allow associating and removing certificates. | `PUT /api/produtos/{id}` with `certificadoIds: number[]` replaces the whole link; `certificadoIds: []` removes all; a nonexistent `certificadoId` responds 404/409, never 500 | Already existed (❌→✅) |

## Scenarios and edge cases

- `certificadoIds` absent from the body: the current link is not touched (the "optional field" behavior, like the other PUT fields).
- `certificadoIds` with duplicate ids: deduplicated before writing (avoids a unique-key error for no reason).
- `certificadoIds` with some nonexistent id: the FK violation (`P2003`) responds 409 (the same pattern already used for nonexistent `categoriaId`/`marcaId`, REQ-PROD-04).
- Nonexistent product: 404, same as the current PUT behavior (REQ-PROD-03).

## Business rules and constraints

- No new rule; the replacement is atomic (`prisma.$transaction`): it removes the old link and writes the new one (or none) in a single transaction, so as not to leave the product momentarily without any certificate if the second step fails.

## Affected interfaces

`PUT /api/produtos/[id]` (field `certificadoIds` in the body) · ADMIN dashboard (Products tab → the edit modal gains a list of certificates with checkboxes).

## Delta in the living spec

`product-management/status.md`: REQ-PROD-05 ❌→✅ (test). `product-management/spec.md`: resolves open question #2. `pending.md`: removes the product↔certificate link row from the backlog.

## Open questions

None blocking. Open question #1 of the living spec ("who maintains products: only ADMIN or also MARCA") stays unanswered, unrelated to this change.
