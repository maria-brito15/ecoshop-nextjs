# PERF · User account and profile

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-11. ADRs: ADR-0017 · ADR-0021 · ADR-0004

## Goal

Let the user see and edit their own data.

## Actors

CUSTOMER · BRAND · ADMIN (each, on their own profile).

## Business rules

- **BR-PERF-01** — A user only sees and edits their own profile; an ADMIN can see and edit anyone's (via /api/users/[id]).
- **BR-PERF-02** — The user does not change their own type.

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-PERF-01 | When an authenticated user accesses their own profile, the system shall show name, email, phone and type. | With a CUSTOMER cookie: the middleware lets /api/users/{id} through and the handler responds 200 without the password |
| REQ-PERF-02 | When the user sends a new name and/or phone for their own profile, the system shall store the data and return the updated user. | PUT /api/users/{id} → 200; database with the new values |
| REQ-PERF-03 | If the edit body includes the type field, the system shall ignore it, keeping the current type. | PUT with type ADMIN by a CUSTOMER → type stays CUSTOMER |
| REQ-PERF-04 | If the profile edit fails, the system shall show the user the error message returned by the API. | An error response with an `error` field → the message appears on screen |
| REQ-PERF-05 | When the user visits a product, the system shall record it in the history and show it in the History tab of the profile. | Visiting 2 products → the tab shows 2 |
| REQ-PERF-06 | When the user opens the Impact tab, the system shall show metrics derived from the user's own real data. | Each metric has a declared source |

## Edge cases

An ADMIN's profile follows the same rules. An empty phone is not sent (the page omits the field). Email and password are accepted by the update schema, but the page only edits name and phone.

## Interfaces

GET/PUT /api/users/[id] · GET /api/auth/me · page /profile.

## Applicable NFRs

NFR-SEG-01.

## Out of scope

Deleting one's own account; changing email and password from the screen.

## Open questions

1. Can the user change their own email and password? (the API allows it; the screen does not)
