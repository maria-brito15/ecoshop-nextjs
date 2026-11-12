# USR · User management (ADMIN)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-12. ADRs: ADR-0017 · ADR-0018

## Goal

Let an ADMIN list, create, edit and delete users, and approve pending BRAND requests.

## Actors

ADMIN.

## Business rules

- **BR-USR-01** — The password is always stored hashed and never returned.
- **BR-USR-02** — Deleting a user who has a brand is restricted by the database.
- **BR-USR-03** — Approving a pending brand changes `Brand.status` and `User.type` together, atomically (ADR-0018).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-USR-01 | When an ADMIN lists users, the system shall return public data (id, name, email, phone, type, createdAt), without the password hash. | GET /api/users by ADMIN → 200, without a `password` field |
| REQ-USR-02 | When an ADMIN session creates a valid user through `POST /api/users`, the system shall store the password hashed and respond 201 without the hash. | POST /api/users with an ADMIN cookie → 201 and a database with a bcrypt hash |
| REQ-USR-03 | When an ADMIN approves a BRAND request, the system shall grant the BRAND role to the user. | POST /api/brands/{id}/approve changes `Brand.status` to APPROVED and `User.type` from CUSTOMER to BRAND |
| REQ-USR-04 | When an ADMIN opens the dashboard, the system shall allow managing users through the interface. | Users tab with list, edit and delete |
| REQ-USR-05 | When an ADMIN lists brands, the system shall include the approval status of each one. | GET /api/brands → each item with `status` (PENDING/APPROVED/REJECTED) |
| REQ-USR-06 | If the `id` of `/api/users/[id]` or of `POST /api/brands/[id]/approve` is not a positive integer (digits only, no leading zeros, up to 2147483647), the system shall respond 400, after checking the session. | ADMIN with `id=abc` → 400; visitor → 403 |
| REQ-USR-07 | When a user update or deletion fails because the user does not exist, the email is repeated or there is a link to a brand, the system shall respond 404, 409 and 409, respectively (never 500). | `PUT` of a nonexistent id → 404; `PUT` with another user's email → 409; `DELETE` of a user with a brand → 409 |
| REQ-USR-08 | If an ADMIN tries to delete their own account, the system shall respond 409 and keep the account. | `DELETE /api/users/<my id>` → 409 |

## Edge cases

An ADMIN can delete themselves (the opposite rule is not specified). A duplicate email on edit returns 409 (to be verified).

## Interfaces

/api/users and /api/users/[id]. /api/brands/[id]/approve (POST, ADMIN).

## Applicable NFRs

NFR-SEG-01.

## Out of scope

Email invitations; action auditing.

## Open questions

1. Can an ADMIN delete their own user or the last ADMIN?
