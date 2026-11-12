# ADR-0011: Product photos on the local filesystem, without metadata in the database

- Status: Accepted
- Date: 2026-11-10 (ratified; the original decision is historical and of no certain date)
- Deciders: Arthur (general authorization, 2026-11-10)
- Origin: inferred from the code, then ratified
- Capabilities: MIDIA

## Context
Evidence: `services/photo.service.ts` writes to `public/data_fotos/{produtoId}_*`; `Produto.fotoUrl` is independent and the only one shown by the UI; `fotos_data` volume in Compose. The living MIDIA spec once described "photo stored in the database as bytes" (BR-MIDIA-01) — that never existed in the code; it was the wrong spec, not the code. Fixed on 2026-11-10 together with this ratification.

## Problem
Where do we store media and how do we associate it with the product?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Filesystem + name prefix (current) | No dependency | Coupled to the disk; the gallery does not show up; Next may not serve new files in production | — |
| B. FotoProduto table + serving route | Explicit association | Migration and route | — |
| C. Object storage | Scale, CDN | Cost and dependency | — |

## Decision
Option A (keep the local filesystem). It already supports multiple photos per product
(the `{produtoId}_` prefix is 1:N, not 1:1) — the gallery (REQ-MIDIA-04) is only missing
in the UI, the storage already handles it. Revisit if and when the deploy becomes
multi-instance (the local volume is not shared between replicas) or if
object storage arrives.

## Rationale
The project is not in production yet (owner's answer, 2026-11-10); switching
storage before needing to is cost without benefit. No new external dependency
is ADR-0003 (simple monolith) applied to media.

## Consequences
Affects: `services/photo.service.ts`, `docker-compose.yml` (`fotos_data` volume).
BR-MIDIA-02 ("at most one main photo") was removed from the spec: it was never
true in the code, which always accepted several photos per product.

## Verification
REQ-MIDIA-01/02/03 in `tests/integration/media.test.ts`.
