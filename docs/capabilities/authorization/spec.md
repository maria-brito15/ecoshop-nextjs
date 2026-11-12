# AUTZ · Authorization (who can do what)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-12. ADRs: ADR-0023 · ADR-0017 · ADR-0008 (historical, superseded)

## Goal

Define, in a single place, which roles can perform each action on each resource, and how the system denies what is not allowed. It is the matrix that the middleware and the handlers implement (ADR-0017).

## Actors

Visitor (no session) · CUSTOMER · BRAND (today with no rights beyond CUSTOMER) · ADMIN.

## Business rules

- **BR-AUTZ-01** — Deny by default: what is not explicitly allowed is denied (proposed; see REQ-AUTZ-07).
- **BR-AUTZ-02** — 401 = no valid session; 403 = valid session without permission.
- **BR-AUTZ-03** — The per-resource access decision lives in the handler; the middleware authenticates and restricts administrative pages (ADR-0017).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-AUTZ-01 | When a write request (create, update, delete) reaches products, categories, brands, certificates or product photos, the system shall require an ADMIN session: 401 without a session and 403 for another role. | POST on each route without a cookie → 401; with a CUSTOMER cookie → 403 |
| REQ-AUTZ-02 | When a visitor reads products or categories, the system shall allow the read without a session. | GET /api/products and /api/categories without a cookie → 200 |
| REQ-AUTZ-03 | When someone triggers the AI scan or chat, the system shall require a session (any role). | POST without a cookie on /api/ai/scan and /api/ai/chat → 401 |
| REQ-AUTZ-04 | When someone lists users, the system shall require an ADMIN session; `POST /api/users` shall create a user of any type (including ADMIN) only for an ADMIN session, and for anyone else it is the public registration, which refuses the ADMIN type (ADR-0023). | GET /api/users: 401 without a cookie, 403 for CUSTOMER; POST /api/users with type ADMIN: 400 for a visitor and for CUSTOMER, 201 for ADMIN |
| REQ-AUTZ-05 | When someone reads or changes /api/users/[id], the system shall allow only the user themselves or an ADMIN, and shall allow deletion only to an ADMIN. | CUSTOMER A reads A → 200; reads B → 403; changes B → 403; deletes A → 403; ADMIN reads A → 200 |
| REQ-AUTZ-06 | When a request reaches the middleware, the system shall require a session on /profile and on /api/users/[id] (the collection /api/users decides in its handler, REQ-AUTZ-04) (redirect to /sign-in?next= for pages and respond 401 JSON for the API) and shall require ADMIN on /dashboard (redirect other roles to /). | middleware(/profile) without a cookie → 307 to /sign-in?next=%2Fprofile; /api/users/1 without a cookie → 401; /dashboard with CUSTOMER → 307 to / |
| REQ-AUTZ-07 | If an API route does not declare its access policy, the system shall deny it by default. | A test walks all app/api routes and fails for a route without a declared policy |
| REQ-AUTZ-08 | When a visitor opens the /ai-scan page, the system shall redirect them to login. | /ai-scan without a session → 307 to /sign-in?next=%2Fai-scan |

## Edge cases

An expired or tampered token is equivalent to no session (401). The BRAND role is today treated as CUSTOMER on all routes. The `/api/admin` prefix is in the middleware rules, but that route does not exist.

## Interfaces

Effective access matrix (verified by REQ-AUTZ-01 to 06):

| Resource | Visitor | CUSTOMER / BRAND | ADMIN |
|---|---|---|---|
| GET products, categories, brands, certificates, photos | ✅ | ✅ | ✅ |
| POST/PUT/DELETE products, categories, brands, certificates, photos | 401 | 403 | ✅ |
| GET /api/users | 401 | 403 | ✅ |
| POST /api/users | public sign-up (CUSTOMER or BRAND) | public sign-up (CUSTOMER or BRAND) | ✅ creates any type |
| GET/PUT /api/users/[id] | 401 | only their own | ✅ |
| DELETE /api/users/[id] | 401 | 403 | ✅ |
| POST /api/ai/scan, /api/ai/chat | 401 | ✅ | ✅ |
| Page /profile | redirects to login | ✅ | ✅ |
| Page /dashboard | redirects to login | redirects to / | ✅ |

## Applicable NFRs

NFR-SEG-04 (deny by default).

## Out of scope

New roles; per-brand permissions (BRAND managing their own products) — depends on the definition of the role (see overview).

## Open questions

1. ~~Should the /ai-scan page require login before opening (REQ-AUTZ-08)?~~ Decided (2026-11-10): yes, require login. Implemented in `config/protected-routes.ts`.
2. What can the BRAND role do? Until there is an answer, BRAND = CUSTOMER.
