# Plan: 003-galeria-de-fotos

- **Spec:** ./spec.md
- **ADRs it follows:** ADR-0011 (photos on the local filesystem) · **New ADRs / ones it supersedes:** none

## Technical approach

The API and the storage already support several photos per product (ADR-0011, REQ-MIDIA-01/02/03, all ✅). Only the screen did not use that. `app/(store)/produtos/[id]/page.tsx` already calls `useGetProduct`; I add `useListPhotos(Number(id))` (an existing hook, no change in `lib/hooks/usePhotos.ts`) and a `selectedPhoto` state. The main image becomes `selectedPhoto ?? product.fotoUrl ?? photos[0]?.url ?? null`, and a strip of thumbnails (one per photo) appears below the main image when `photos.length > 0`; clicking a thumbnail changes `selectedPhoto`.

Discarded alternative: a third-party carousel component. Rejected as a disproportionate add-on for a simple thumbnail gallery, and for introducing a new dependency without need.

## Constitution Check

| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | partial | no component-test suite in the project (ADR-0016 covers only the API); verified via the real API (`curl`) and code; a manual check with a browser is missing |
| V Layers | yes | yes | the page only consumes existing hooks, no direct call to `lib/db` or the filesystem |
| XI No invented data | yes | yes | the gallery only shows real photos returned by the API |

## Affected files

| File | Change | REQ |
|---|---|---|
| `app/(store)/produtos/[id]/page.tsx` | consumes `useListPhotos`; `selectedPhoto` state; thumbnail strip | REQ-MIDIA-04 |
| `docs/capabilities/midia-de-produto/{spec,status}.md` | REQ-MIDIA-04 ❌→◐ (code + API verified; manual check in the browser missing) | REQ-MIDIA-04 |
| `docs/architecture/adr/pendentes.md` | removes the gallery row from the backlog | — |

## Verification plan

API: `GET /api/produtos/{id}/fotos` already covered by REQ-MIDIA-01/02/03; also confirmed live against the dev server with a 2-photo product (`total: 2`, correct URLs). Manual pending: open `/produtos/{id}` in the browser with a product of 3+ photos and confirm that 3 clickable thumbnails appear and swap the main image — not done in this session for lack of a browser tool.

## Risks and rollback

Risk: does a product without extra photos lose anything? No — `photos.length === 0` keeps the current behavior (only `fotoUrl` or the icon). Rollback: remove the thumbnail block and the `useListPhotos` import (it touches neither the API nor the database).

## Complexity Tracking

No violations.
