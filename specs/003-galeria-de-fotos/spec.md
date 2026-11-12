# Change spec: 003-galeria-de-fotos

- **Track:** fix (the code violates REQ-MIDIA-04; the rule already exists in the spec, only the UI is missing — decided by the owner on 2026-11-10)
- **Affected capabilities:** MIDIA (`docs/capabilities/midia-de-produto`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (feature chosen from the backlog on 2026-11-10; no new architecture decision) · **Date:** 2026-11-10

## Problem

The product page (`/produtos/[id]`) only shows `produto.fotoUrl` (one image). The backend already supports several photos per product (`GET /api/produtos/{id}/fotos`, `ADR-0011`, tested by REQ-MIDIA-01/02/03) and the `useListPhotos` hook already exists, but no screen uses that list to show a gallery — REQ-MIDIA-04 is ❌.

## Out of scope

- Any change to the photo backend/storage (it already works, covers REQ-MIDIA-01/02/03).
- Resizing, CDN, uploading several at once (already out of scope of the capability).
- Reordering photos or marking one as "main" (`fotoUrl` stays the initial image shown).

## Current behavior (fact, with evidence)

- `app/(store)/produtos/[id]/page.tsx:257-271`: renders only `produto.fotoUrl`, without calling `useListPhotos`.
- `lib/hooks/usePhotos.ts:40-42`: `useListPhotos(produtoId)` already exists and calls `GET /api/produtos/{id}/fotos`.
- `docs/capabilities/midia-de-produto/status.md:12`: REQ-MIDIA-04 ❌, in the backlog.

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-MIDIA-04 | When the product has several photos, the system shall show the gallery on the product page. | A product with 3 photos shows 3 clickable thumbnails that swap the main image | Already exists (❌→✅) |

## Scenarios and edge cases

- A product without extra photos (`fotos.length === 0`): shows only `fotoUrl` (or the fallback icon), without a thumbnail strip — current behavior preserved.
- A product with photos but without `fotoUrl`: the first photo in the list becomes the initial main image.
- Click on a thumbnail: swaps the main image shown, without page navigation.

## Business rules and constraints

- None new; it reuses BR-MIDIA-01 (filesystem storage) and the already-tested endpoint.
- Constitution Art. XI: no invented data — the gallery only shows real photos coming from the API.

## Affected interfaces

`app/(store)/produtos/[id]/page.tsx` (consumes `useListPhotos`, already existing).

## Delta in the living spec

`midia-de-produto/status.md`: REQ-MIDIA-04 ❌→✅ (test/manual). `pendentes.md`: removes the gallery row from "Features decided, not yet built".

## Open questions

None blocking.
