# Change spec: 001-own-user-profile

- **Track:** fix (the code violates REQ-PERF-01 and REQ-AUTZ-05; the rule does not change)
- **Affected capabilities:** PERF, AUTZ (`docs/capabilities/account-and-profile`, `docs/capabilities/authorization`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (general approval to run the roadmap on 2026-11-10; G1 recorded in `docs/learning/`) · **Date:** 2026-11-10

## Problem
A logged-in CLIENTE or MARCA opens `/perfil` and the page does not load their own data, nor can it save changes: the middleware responds 403 to `/api/usuarios/{id}`, a route the page uses. The handler already allowed "the user themselves or ADMIN", but was never reached. In addition, when saving fails, the screen always shows "Erro ao salvar." because it reads a field that the API does not send.

## Out of scope
- History of viewed products and impact metrics (REQ-PERF-05, REQ-PERF-06: they depend on an owner decision).
- The "deny by default" policy (REQ-AUTZ-07).
- Changing who can list, create or delete users.

## Current behavior (fact, with evidence)
- `config/protected-routes.ts`: `/api/usuarios` with `nivel: "admin"` → the middleware denies CLIENTE/MARCA with 403 (`middleware.ts:86-89`).
- `app/api/usuarios/[id]/route.ts`: the handler already applies "own or ADMIN" (REQ-AUTZ-05, covered by a test).
- `app/(perfil)/perfil/page.tsx:537`: `data.mensagem ?? "Erro ao salvar."`; the API responds `{ erro }`.
- Characterization test `REQ-PERF-01` marked `todo` (D1).

## Requirements
| ID | Requirement | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-PERF-01 | When an authenticated user accesses their own profile, the system shall show name, email, phone and type. | The middleware lets `/api/usuarios/{id}` through with a CLIENTE cookie and the handler responds 200 without the password | Already exists (❌→✅) |
| REQ-AUTZ-06 | The middleware shall require a session on `/perfil` and `/api/usuarios` (and ADMIN on `/painel`). | 401 without a cookie on `/api/usuarios/1`; `/painel` with CLIENTE redirects | Changes (the text already described a session; the code required ADMIN) |
| REQ-PERF-04 | If the profile edit fails, the system shall show the error message returned by the API. | Response `{ erro: "X" }` → the screen shows "X" | Already exists (fixed in the code) |

## Scenarios and edge cases
- CLIENTE A asks for B's profile → 403 coming from the handler (stays denied).
- CLIENTE lists `/api/usuarios` → 403 coming from the handler (REQ-AUTZ-04).
- No cookie → 401 from the middleware.

## Business rules and constraints
- ADR-0017: the middleware authenticates; the handler decides per resource.
- Constitution Art. III (authorization) and IV (sensitive data: no response with `senha`).

## Affected interfaces
`GET/PUT /api/usuarios/[id]` (access by the user themselves) · page `/perfil`.

## Delta in the living spec
`account-and-profile/status.md`: REQ-PERF-01 ❌→✅ (test); REQ-PERF-04 stays ◐ until a manual check on screen. `autorizacao`: no text change.

## Open questions
- None blocking. The manual check of REQ-PERF-04 in the interface stays pending (it needs a browser and an account).
