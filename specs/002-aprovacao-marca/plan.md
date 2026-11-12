# Plan: 002-aprovacao-marca

- **Spec:** ./spec.md
- **ADRs it follows:** ADR-0017 (access decision in the handler) · **New ADRs / ones it supersedes:** ADR-0018 (new)

## Technical approach

1. **Schema:** `prisma/schema.prisma` gains `enum StatusMarca { PENDENTE APROVADA REJEITADA }` and `Marca.status StatusMarca @default(PENDENTE)`. The migration includes a data step: `UPDATE marcas SET status = 'APROVADA'` for existing rows (preserves the current catalog — no already registered brand should become pending retroactively).
2. **Public sign-up:** `publicRegistrationSchema` (`lib/schemas/user.ts`) gains `marcaNome` (required when `tipo === "MARCA"`, via `.superRefine`) and an optional `marcaDescricao`.
3. **Service:** `createUser` (`services/user.service.ts`) receives optional `marcaNome`/`marcaDescricao`; when `tipo === "MARCA"`, it stores the `Usuario` with `tipo: "CLIENTE"` (not the requested value) and creates the associated `Marca` with `status: "PENDENTE"`, in a `prisma.$transaction`. This is a new, small function (`createUserWithBrandRequest` or a branch inside `createUser` — I decide in the code by whichever is simpler) so as not to mix with the ordinary CLIENTE path.
4. **`createBrand` (existing ADMIN flow, dashboard):** keeps requiring `usuario.tipo === "MARCA" || "ADMIN"` (REQ-REF-04, unchanged) and creates with `status: "APROVADA"` directly — this path does not go through pending, since the ADMIN is already deciding at creation time.
5. **Approval:** new `services/brand.service.ts::approveBrand(id)`: fetches the `Marca`, confirms `status === "PENDENTE"` (otherwise error `MARCA_NAO_PENDENTE`), and runs a `$transaction` with `marca.update({status: "APROVADA"})` + `usuario.update({tipo: "MARCA"})`. Invalidates the brand and user caches.
6. **Route:** `app/api/marcas/[id]/aprovar/route.ts`, `POST`, `requireAdmin`, calls `approveBrand`. 404 if the brand does not exist, 409 if it is no longer pending.
7. **`GET /api/marcas` and `GET /api/marcas/[id]`:** already return the whole entity (`include`), so `status` shows up with no code change — it only needs confirming in the test.
8. **Dashboard:** `BrandsSection` (`app/(admin)/painel/page.tsx`) gains a "Status" column in the table and an "Approve" button when `status === "PENDENTE"`, using a new hook `useApproveBrand` next to the existing hooks in `lib/hooks/useBrands.ts`.
9. **Pending message:** `app/(auth)/sign-in/page.tsx` already has an "I am a Store / Partner" checkbox (`form.isLoja`), but the body sent to `POST /api/users` today **does not include `tipo`** or a brand name — a finding during the plan (drift not yet covered by a REQ, recorded here instead of deciding alone): the checkbox does nothing today. This change fixes that as part of delivering REQ-AUTH-11 end to end: when `isLoja` is checked, it shows a required "Brand name" field and sends `tipo: "MARCA"` + `marcaNome` in the body; the response (`marcaPendente: true`) switches the screen to the pending message instead of redirecting to `/`.

Discarded alternative: ask for `marcaNome` only at approval (the ADMIN types the name). Rejected because the one who knows the brand name is whoever signs up, not the ADMIN.

## Constitution Check

| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | yes | REQ-AUTH-11/14, REQ-USR-03/05 with a new test |
| III Authorization | yes | yes | `requireAdmin` on the approval route (ADR-0017) |
| IV Sensitive data | yes | yes | the approval response uses `PUBLIC_USER_FIELDS`, without the password |
| V Layers | yes | yes | handler calls `services/`; the transaction stays in the service |
| VII Errors | yes | yes | 404 (nonexistent brand), 409 (no longer pending), 400 (without `marcaNome`) mapped, not 500 |
| XI No invented data | yes | yes | the pending message stays as text to confirm (marked in the spec), not treated as fact |

## Affected files

| File | Change | REQ |
|---|---|---|
| `prisma/schema.prisma` | `enum StatusMarca`; `Marca.status` | REQ-AUTH-11, REQ-USR-03 |
| new Prisma migration | `status` + `APROVADA` backfill on existing rows | REQ-AUTH-11 |
| `lib/schemas/user.ts` | `publicRegistrationSchema`: `marcaNome`/`marcaDescricao` + `superRefine` | REQ-AUTH-14 |
| `services/user.service.ts` | `createUser` creates a pending `Marca` when `tipo === "MARCA"` | REQ-AUTH-11 |
| `services/brand.service.ts` | new `approveBrand(id)` | REQ-USR-03 |
| `app/api/users/route.ts` | passes `marcaNome`/`marcaDescricao`; the response signals pending | REQ-AUTH-11, REQ-AUTH-14 |
| `app/api/marcas/[id]/aprovar/route.ts` (new) | `POST`, `requireAdmin`, calls `approveBrand` | REQ-USR-03 |
| `lib/hooks/useBrands.ts` | new `useApproveBrand` | REQ-USR-05 |
| `app/(admin)/painel/page.tsx` (`BrandsSection`) | status column + Approve button | REQ-USR-05 |
| `app/(auth)/sign-in/page.tsx` | fixes sending `tipo`/`marcaNome` when `isLoja`; pending message | REQ-AUTH-11 |
| `tests/integration/authentication.test.ts` | tests REQ-AUTH-11, REQ-AUTH-14 | REQ-AUTH-11, REQ-AUTH-14 |
| `tests/integration/users.test.ts` | tests REQ-USR-03, REQ-USR-05 | REQ-USR-03, REQ-USR-05 |
| `docs/capabilities/autenticacao/status.md` | status | REQ-AUTH-11, REQ-AUTH-14 |
| `docs/capabilities/gestao-de-usuarios/status.md` and `spec.md` | status + BR-USR-03 | REQ-USR-03, REQ-USR-05 |
| `docs/architecture/adr/pendentes.md` | removes P11 and the corresponding backlog row | — |
| `docs/architecture/adr/README.md` | adds ADR-0018 to the index | — |

## Verification plan

Integration: REQ-AUTH-11 (MARCA sign-up → `Usuario.tipo === "CLIENTE"`, `Marca.status === "PENDENTE"`), REQ-AUTH-14 (without `marcaNome` → 400), REQ-USR-03 (approve → `Usuario.tipo === "MARCA"`, `Marca.status === "APROVADA"`; approve again → 409), REQ-USR-05 (`GET /api/marcas` includes `status`). Unit/service: `createBrand` keeps rejecting a CLIENTE user outside the pending flow (REQ-REF-04 does not regress). Manual: sign up as MARCA through the screen, see the pending message; approve through the dashboard and confirm that the next login already has type MARCA (via `/api/auth/refresh`).

## Risks and rollback

Risk: existing brands becoming `PENDENTE` by mistake in the migration and "disappearing" from flows that assume implicit approval (today no endpoint filters by status, but the dashboard may start hiding pending ones from some future list). Mitigation: the migration backfill is explicit and tested before the deploy; no public listing (`GET /api/marcas`, catalog) filters by `status` in this change — only the ADMIN dashboard shows the column. Risk: the approval transaction failing halfway. Mitigation: `prisma.$transaction` guarantees atomicity. Rollback: `migration down` removes the column/enum; `approveBrand` and the new route can be removed without affecting the rest because nothing else references them yet.

## Complexity Tracking

No violations. The branch in `createUser` for `tipo === "MARCA"` is the only new conditional logic of weight; it stays in the service (ADR-0017/Art. V).
