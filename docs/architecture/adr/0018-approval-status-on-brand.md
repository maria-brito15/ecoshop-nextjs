# ADR-0018: The approval status of a MARCA sign-up lives on `Marca`, not on `Usuario`

- Status: Accepted
- Date: 2026-11-10
- Deciders: Arthur (G1 of `specs/002-brand-approval/spec.md` on 2026-11-10) and Claude
- Origin: new (resolves P11 of `docs/architecture/adr/pending.md`)
- Capabilities: AUTH, USR

## Context

REQ-AUTH-11 (owner's proposal, 2026-11-10) requires that signing up as MARCA stays pending until an ADMIN approves; REQ-USR-03 requires the approval endpoint. P11 recorded that it was still to be decided where to store this status: on `Usuario` or on `Marca`.

## Problem

Where does the "pending/approved" status of a request to sign up as MARCA live?

## Alternatives

| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Status on `Marca` (chosen) | `Marca` already models the name/description of the request; the dashboard's "Brands" tab is already the natural place for the ADMIN to decide | Public sign-up now requires `marcaNome`; data migration for existing brands (`status = APROVADA`) | — |
| B. Status on `Usuario` (`statusAprovacaoMarca`) | Does not touch the brand registry | Duplicates the modeling of the "request" outside `Marca`; the brand name would have to be asked again at approval or stored loose on `Usuario` | Makes it hard to reuse the "Brands" tab that already exists in the dashboard |

## Decision

Option A. `Marca` gains `status: StatusMarca` (`PENDENTE` by default). Public sign-up with `tipo: "MARCA"` creates the `Usuario` as `CLIENTE` and a `Marca` with `status: PENDENTE`. A dedicated endpoint (`POST /api/marcas/[id]/aprovar`) changes `Marca.status → APROVADA` and `Usuario.tipo → MARCA` in a transaction. `PUT /api/marcas/[id]` (generic edit) does not decide approval. Rejection has no dedicated flow in this change: the ADMIN deletes the pending `Marca` through the existing CRUD.

## Rationale

`Marca` is already the entity that carries the data of the "request" (name, description); putting the status on it avoids a second source of truth and reuses the screen the ADMIN already uses (`BrandsSection` in the dashboard).

## Consequences

- `publicRegistrationSchema` gains a required `marcaNome` (and an optional `marcaDescricao`) when `tipo: "MARCA"` (REQ-AUTH-14).
- Data migration: existing brands receive `status = APROVADA` so as not to regress the current catalog.
- `createUser`/the sign-up route now create `Usuario` + `Marca` together when `tipo: "MARCA"` — the access decision and the transaction live in the service, called by the handler (ADR-0017).
- Affects: `prisma/schema.prisma`, `lib/schemas/user.ts`, `services/user.service.ts`, `services/brand.service.ts`, `app/api/users/route.ts`, new `app/api/marcas/[id]/aprovar/route.ts`, `app/(admin)/painel/page.tsx` (`BrandsSection`).

## Verification

REQ-AUTH-11, REQ-AUTH-14, REQ-USR-03, REQ-USR-05 tests in `tests/integration`.
