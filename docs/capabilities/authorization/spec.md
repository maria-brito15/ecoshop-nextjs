# AUTZ · Authorization (who can do what)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0017 · ADR-0008 (historical, superseded)

## Goal

Define, in a single place, which roles can perform each action on each resource, and how the system denies what is not allowed. It is the matrix that the middleware and the handlers implement (ADR-0017).

## Actors

Visitor (no session) · CLIENTE · MARCA (today with no rights beyond CLIENTE) · ADMIN.

## Business rules

- **BR-AUTZ-01** — Deny by default: what is not explicitly allowed is denied (proposed; see REQ-AUTZ-07).
- **BR-AUTZ-02** — 401 = no valid session; 403 = valid session without permission.
- **BR-AUTZ-03** — The per-resource access decision lives in the handler; the middleware authenticates and restricts administrative pages (ADR-0017).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-AUTZ-01 | When a write request (create, update, delete) reaches products, categories, brands, certificates or product photos, the system shall require an ADMIN session: 401 without a session and 403 for another role. | POST on each route without a cookie → 401; with a CLIENTE cookie → 403 |
| REQ-AUTZ-02 | When a visitor reads products or categories, the system shall allow the read without a session. | GET /api/produtos and /api/categorias without a cookie → 200 |
| REQ-AUTZ-03 | When someone triggers the AI scan or chat, the system shall require a session (any role). | POST without a cookie on /api/ia/scan and /api/ia/chat → 401 |
| REQ-AUTZ-04 | When someone lists or creates users, the system shall require an ADMIN session. | GET /api/usuarios: 401 without a cookie, 403 for CLIENTE |
| REQ-AUTZ-05 | When someone reads or changes /api/usuarios/[id], the system shall allow only the user themselves or an ADMIN, and shall allow deletion only to an ADMIN. | CLIENTE A reads A → 200; reads B → 403; changes B → 403; deletes A → 403; ADMIN reads A → 200 |
| REQ-AUTZ-06 | When a request reaches the middleware, the system shall require a session on /perfil and on /api/usuarios (redirect to /sign-in?next= for pages and respond 401 JSON for the API) and shall require ADMIN on /painel (redirect other roles to /). | middleware(/perfil) without a cookie → 307 to /sign-in?next=%2Fperfil; /api/usuarios/1 without a cookie → 401; /painel with CLIENTE → 307 to / |
| REQ-AUTZ-07 | If an API route does not declare its access policy, the system shall deny it by default. | A test walks all app/api routes and fails for a route without a declared policy |
| REQ-AUTZ-08 | When a visitor opens the /ia-scan page, the system shall redirect them to login. | /ia-scan without a session → 307 to /sign-in?next=%2Fia-scan |

## Edge cases

An expired or tampered token is equivalent to no session (401). The MARCA role is today treated as CLIENTE on all routes. The `/api/admin` prefix is in the middleware rules, but that route does not exist.

## Interfaces

Effective access matrix (verified by REQ-AUTZ-01 to 06):

| Resource | Visitor | CLIENTE / MARCA | ADMIN |
|---|---|---|---|
| GET products, categories, brands, certificates, photos | ✅ | ✅ | ✅ |
| POST/PUT/DELETE products, categories, brands, certificates, photos | 401 | 403 | ✅ |
| GET/POST /api/usuarios | 401 | 403 | ✅ |
| GET/PUT /api/usuarios/[id] | 401 | only their own | ✅ |
| DELETE /api/usuarios/[id] | 401 | 403 | ✅ |
| POST /api/ia/scan, /api/ia/chat | 401 | ✅ | ✅ |
| Page /perfil | redirects to login | ✅ | ✅ |
| Page /painel | redirects to login | redirects to / | ✅ |

## Applicable NFRs

NFR-SEG-04 (deny by default).

## Out of scope

New roles; per-brand permissions (MARCA managing their own products) — depends on the definition of the role (see overview).

## Open questions

1. ~~Should the /ia-scan page require login before opening (REQ-AUTZ-08)?~~ Decided (2026-11-10): yes, require login. Implemented in `config/protected-routes.ts`.
2. What can the MARCA role do? Until there is an answer, MARCA = CLIENTE.
