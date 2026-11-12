# Change spec: 002-brand-approval

- **Track:** full (new behavior; resolves the pending decision P11)
- **Affected capabilities:** AUTH, USR (`docs/capabilities/authentication`, `docs/capabilities/user-management`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (G1 approved on 2026-11-10) · **Date:** 2026-11-10

## Problem

Today, whoever signs up with `tipo: "MARCA"` receives the MARCA role immediately (`POST /api/users` → `createUser` stores `tipo` as it came in the body). This violates REQ-AUTH-11 (owner's proposal on 2026-11-10): signing up as MARCA should stay pending until an ADMIN approves. REQ-USR-03 (approve a MARCA request) has no endpoint or screen — it is in the backlog (P11) because it is still to be decided **where the request status lives**: on `Usuario` or on `Marca`.

## Out of scope

- An explicit rejection flow with notification to the user (I only handle approval; rejection stays as a manual deletion/edit by the ADMIN, through the existing dashboard).
- Email invitation or approval notification (gestao-de-usuarios already lists this as out of scope).
- Changing the dashboard's "Brands" tab beyond what is needed to approve.

## Architecture decision (P11) — recommendation

**Recommended model: status on `Marca`, not on `Usuario`.**

- The `Usuario` who signs up as MARCA is created with `tipo: "CLIENTE"` (CLIENTE rights while pending, as BR-AUTH-04 already proposes) and, together with it, a `Marca` is created with a new field `status: StatusMarca` (`PENDENTE` by default).
- This requires capturing the name (and optionally the description) of the intended brand in public sign-up, which is absent today from `publicRegistrationSchema` (`lib/schemas/user.ts:86-91`).
- ADMIN approves: `Marca.status → APROVADA` and `Usuario.tipo → MARCA`, in a transaction (`$transaction`).
- Existing brands (created today by the ADMIN directly in the dashboard, without this flow) receive `status: APROVADA` in the data migration, so as not to regress the current behavior of the brand CRUD.

**Why not on `Usuario`:** `Usuario` has no brand data today (name, description) — storing only a status there does not record the *request* itself, and the dashboard's "Brands" tab (`app/(admin)/painel/page.tsx`, `BrandsSection`) is already the natural place for the ADMIN to see and decide requests, listing by status.

**Alternative (rejected):** a status field on `Usuario` (e.g. `statusAprovacaoMarca`) with `Marca` only being created at approval. Rejected because it duplicates the modeling of a "brand request" outside the `Marca` entity, and would require asking for the brand name again at approval time (losing the data from the original sign-up) or storing it loose on `Usuario`.

This becomes ADR-0018 in the plan (G2), with the alternatives above.

## Current behavior (fact, with evidence)

- `lib/schemas/user.ts:86-91`: `publicRegistrationSchema` accepts `tipo: "CLIENTE" | "MARCA"`, with no brand field.
- `services/user.service.ts:85` (`createUser`): stores `tipo` exactly as received — there is no pending state.
- `services/brand.service.ts:107-117` (`createBrand`): today only called by the ADMIN in the dashboard, after the user is already MARCA; requires `usuario.tipo === "MARCA" || "ADMIN"`.
- `docs/capabilities/authentication/status.md:19`: REQ-AUTH-11 ❌.
- `docs/capabilities/user-management/status.md:11`: REQ-USR-03 ❌, in the backlog because of P11.
- `prisma/schema.prisma:37-46`: `Marca` has no status field.

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-AUTH-11 | When someone signs up as MARCA, the system shall create the user as CLIENTE and a `Marca` with status PENDENTE, and grant MARCA rights only after approval by an ADMIN. | `POST /api/users` with `tipo: "MARCA"` → 201, `Usuario.tipo === "CLIENTE"`, an associated `Marca.status === "PENDENTE"` | Changes (the text already existed; the behavior changes) |
| REQ-AUTH-14 | If sign-up asks for `tipo: "MARCA"` without the brand name, the system shall respond 400. | `POST /api/users` with `tipo: "MARCA"` and without `marcaNome` → 400 | New |
| REQ-USR-03 | When an ADMIN approves a pending brand, the system shall change `Marca.status` to APROVADA and the associated `Usuario.tipo` to MARCA, atomically. | `POST /api/marcas/[id]/aprovar` by ADMIN → 200; `Marca.status === "APROVADA"`, the associated user becomes MARCA | Already in the spec (❌→✅), new dedicated endpoint |
| REQ-USR-05 | When an ADMIN lists brands, the system shall include the status (`PENDENTE`/`APROVADA`/`REJEITADA`) of each one. | `GET /api/marcas` by ADMIN → 200, each item with `status` | New |

## Scenarios and edge cases

- Sign-up as CLIENTE (without `marcaNome`) → current behavior, no change (does not create a `Marca`).
- ADMIN rejects: out of scope in this change; the ADMIN can delete the pending `Marca` through the existing CRUD (behavior already covered by REQ-USR-04), which leaves the user as CLIENTE permanently — acceptable as a "manual rejection".
- A pending user logs in: the session is issued with `tipo: "CLIENTE"` (CLIENTE rights); `/api/auth/refresh` already reissues the token if the type in the database changes after approval (existing REQ-AUTH, unchanged).
- Pre-existing brands in the database (seed or created by the ADMIN before this change): the data migration sets `status = APROVADA` for all of them, preserving the current catalog.

## Business rules and constraints

- BR-AUTH-04 (owner's proposal): CLIENTE rights while pending — confirmed by this spec.
- ADR-0017: the access decision stays in the handler, not in the middleware; `PUT /api/marcas/[id]` follows the same pattern as the other ADMIN handlers.
- Constitution Art. IV: the approval response must not include the user's password.

## Affected interfaces

- `POST /api/users` (the body gains `marcaNome`, `marcaDescricao?` when `tipo: "MARCA"`).
- `POST /api/marcas/[id]/aprovar` (new; dedicated to the status transition — `PUT /api/marcas/[id]` keeps only editing name/description/usuarioId).
- `GET /api/marcas` (the response gains a `status` field).
- ADMIN dashboard, "Brands" tab (`BrandsSection`): status column + "Approve" action for `PENDENTE`.
- Prisma: `enum StatusMarca { PENDENTE APROVADA REJEITADA }`, `Marca.status StatusMarca @default(PENDENTE)` + data migration for existing brands.

## Delta in the living spec

- `authentication/status.md`: REQ-AUTH-11 ❌→✅ (test); new REQ-AUTH-14.
- `user-management/status.md`: REQ-USR-03 ❌→✅ (test), leaves the backlog; new REQ-USR-05; `spec.md` gains BR-USR-03 (the status transition is atomic).
- `docs/architecture/adr/pending.md`: removes the P11 row from the table and the corresponding row in "Features decided, not yet built".
- New ADR-0018 (brand approval model).

## G1 decisions (2026-11-10)

- Status model on `Marca`: approved as recommended.
- Approval endpoint: dedicated (`POST /api/marcas/[id]/aprovar`), does not reuse the generic `PUT`.
- Rejection: out of scope in this change; "the ADMIN deletes the pending brand" is the accepted way to reject for now. `REJEITADA` stays in the enum with no flow that produces it.

## Open questions

1. Message shown to whoever signs up as MARCA while pending (inherited from REQ-AUTH-11) — I propose "Seu cadastro como marca parceira está em análise; por enquanto você tem acesso como cliente." (UI copy as originally proposed), final text to confirm at implementation (not blocking).
