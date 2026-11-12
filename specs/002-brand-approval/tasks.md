# Tasks: 002-brand-approval

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | Prisma migration: `enum StatusMarca`, `Marca.status @default(PENDENTE)`, `APROVADA` backfill on existing rows | REQ-AUTH-11, REQ-USR-03 | — | `npx prisma migrate dev` runs clean; seed brands stay `APROVADA` | [x] (migration written by hand and applied with `prisma migrate deploy`: no reachable Postgres for `migrate dev` to generate the diff) |
| T2 | Failing test: REQ-AUTH-11 (MARCA sign-up → `Usuario.tipo=CLIENTE`, `Marca.status=PENDENTE`) and REQ-AUTH-14 (without `marcaNome` → 400) in `tests/integration/authentication.test.ts` | REQ-AUTH-11, REQ-AUTH-14 | T1 | the tests exist and fail for the right reason | [x] |
| T3 | `publicRegistrationSchema`: `marcaNome`/`marcaDescricao` + `superRefine` requiring `marcaNome` when `tipo === "MARCA"` | REQ-AUTH-14 | T2 | T2 (400 part) passes | [x] |
| T4 | `createUser`: on `tipo === "MARCA"`, stores `Usuario` as `CLIENTE` and creates a `PENDENTE` `Marca` in a transaction | REQ-AUTH-11 | T3 | T2 (pending part) passes | [x] |
| T5 | `app/api/users/route.ts`: passes `marcaNome`/`marcaDescricao`; the response includes `marcaPendente: true` when applicable | REQ-AUTH-11 | T4 | the route's integration test passes | [x] |
| T6 | Failing test: REQ-USR-03 (approving a pending brand changes `Usuario.tipo` and `Marca.status`; approving again → 409) and REQ-USR-05 (`GET /api/marcas` includes `status`) in `tests/integration/users.test.ts` | REQ-USR-03, REQ-USR-05 | T1 | the tests exist and fail for the right reason | [x] |
| T7 | `services/brand.service.ts::approveBrand(id)` (transaction `Marca.status→APROVADA` + `Usuario.tipo→MARCA`; error `MARCA_NAO_PENDENTE` if no longer pending) | REQ-USR-03 | T6 | the "approve" part of T6 passes | [x] |
| T8 | `app/api/marcas/[id]/aprovar/route.ts` (`POST`, `requireAdmin`, maps 404/409) | REQ-USR-03 | T7 | T6 passes completely | [x] |
| T9 | Confirm that `createBrand` (ADMIN/dashboard flow) keeps requiring `tipo MARCA/ADMIN` and creates with `status APROVADA` — a non-regression test of REQ-REF-04 | REQ-REF-04 | T1 | the existing REQ-REF-04 test keeps passing without a behavior change | [x] |
| T10 | `useApproveBrand` in `lib/hooks/useBrands.ts` | REQ-USR-05 | T8 | the hook calls `POST .../aprovar` and invalidates the listing | [x] |
| T11 | `BrandsSection` in the dashboard: "Status" column + "Approve" button when `PENDENTE` | REQ-USR-05 | T10 | manual: ADMIN sees and approves a pending brand through the UI | [x] code + end-to-end flow verified via `curl` against the dev server (no browser tool in this environment); **not visually verified on the dashboard screen** |
| T12 | `app/(auth)/sign-in/page.tsx`: fixes sending `tipo`/`marcaNome` when `isLoja`; "Brand name" field; pending message on receiving `marcaPendente: true` | REQ-AUTH-11 | T5 | manual: sign-up as a store shows the message and does not redirect to `/` | [x] code + `POST /api/users` verified via `curl` (`marcaPendente: true`); **sign-up screen not visually verified** |
| T13 | Consolidate `authentication/status.md`, `user-management/{spec,status}.md`; remove P11 from `pending.md`; add ADR-0018 to `adr/README.md` | — | T2–T12 | `npm run sdd:check` passes | [x] |
| T14 | Final verification: lint, `tsc --noEmit`, `npm test` | — | T13 | all pass | [x] `npm test` with 2 pre-existing, unrelated failures (REQ-SCAN-05 known defect D4; REQ-OPS-02 due to stale data in the local database — see the note below) |

## Note on T14

`REQ-OPS-02` failed in this environment because `admin@ecoplace.com` already existed in the local database since 2026-04-26 (placeholder hash, from before the D6 fix of `prisma/seed.ts`), and the seed's `upsert` does not update existing users. It is not a regression of this change: no authentication/user-seed file was touched by `002-brand-approval` beyond the `status: "APROVADA"` line in `prisma/seed.ts` (seed brands, not users). `REQ-SCAN-05` is the known defect D4, already documented before this change.
