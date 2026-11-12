# REF · Reference registries (categories, brands, certificates)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0009 · ADR-0017

## Goal

Let an ADMIN maintain the registries used by products, preserving integrity.

## Actors

ADMIN (write); everyone (read, see AUTZ-02).

## Business rules

- **BR-REF-01** — Category, brand and certificate names are unique.
- **BR-REF-02** — Each brand belongs to exactly one user, and each user has at most one brand.
- **BR-REF-03** — A registry entry that has linked products cannot be deleted.

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-REF-01 | When an ADMIN creates a valid category, the system shall respond 201. | POST /api/categorias → 201 |
| REQ-REF-02 | If the given name already exists, the system shall respond 409 when creating a category, brand or certificate. | Duplicate name → 409 |
| REQ-REF-03 | If a category, brand or certificate has links, the system shall respond 409 when deleting it. | DELETE of a category with products → 409 |
| REQ-REF-04 | If an ADMIN creates a brand for a user who is neither of type MARCA nor ADMIN, the system shall refuse. | POST /api/marcas with a CLIENTE user → 409; with a nonexistent user → 404 |
| REQ-REF-05 | If the `id` in the category, brand or certificate routes is not a positive integer, the system shall respond 400. | `abc`, `0`, `1.5` → 400 on GET, PUT and DELETE |

## Edge cases

Creating a brand requires typing the user ID in the dashboard. Changing a brand does not invalidate the product cache (see REQ-PROD-02).

## Interfaces

/api/categorias, /api/marcas, /api/certificados (+ /[id]) · dashboard (tabs).

## Applicable NFRs

NFR-CONS-01.

## Out of scope

Category hierarchy.

## Open questions

1. ~~Does the owner of a brand need to be of type MARCA (REQ-REF-04)?~~ Decided (2026-11-10): must be MARCA or ADMIN; `services/brand.service.ts` refuses CLIENTE with 409.
