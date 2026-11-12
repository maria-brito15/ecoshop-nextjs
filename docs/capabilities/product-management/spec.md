# PROD · Product management (admin dashboard)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-11. ADRs: ADR-0009 · ADR-0017

## Goal

Let an ADMIN create, edit and delete catalog products.

## Actors

ADMIN.

## Business rules

- **BR-PROD-01** — Every product belongs to an existing category and an existing brand.

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-PROD-01 | When an ADMIN creates a valid product, the system shall respond 201 and shall list it in the catalog right away. | POST /api/products → 201; the listing with the product name includes it without waiting for the TTL |
| REQ-PROD-02 | When a brand or category is changed, the system shall reflect the new name on the displayed products without waiting for the cache to expire. | Rename the brand → GET /api/products/[id] already shows the new name |
| REQ-PROD-03 | If an ADMIN updates a product that does not exist, the system shall respond 404. | PUT /api/products/99999999 → 404 |
| REQ-PROD-04 | If an ADMIN creates or updates a product with a nonexistent category or brand, the system shall respond 4xx with a clear message. | nonexistent categoryId → 404 or 409, not 500 |
| REQ-PROD-05 | When an ADMIN edits a product, the system shall allow associating and removing certificates. | PUT with certificateIds updates the link |
| REQ-PROD-06 | If the `id` of `PUT` or `DELETE /api/products/[id]` is not a positive integer, the system shall respond 400. | ADMIN with `id=abc` → 400 |
| REQ-PROD-07 | If an ADMIN tries to delete a product that has linked certificates, the system shall respond 409 and keep the product and the links; after unlinking the certificates (`PUT` with `certificateIds: []`), the deletion shall work. Owner decision (2026-11-11): block, not cascade. | `DELETE` with a linked certificate → 409; after `PUT {certificateIds: []}` → 200 |

## Edge cases

The dashboard lists up to 100 products at once (no pagination). Price sent as a JSON number. Deleting a product with certificates: the link's FK is RESTRICT (to be verified).

## Interfaces

POST /api/products · PUT/DELETE /api/products/[id] · page /dashboard (Products tab).

## Applicable NFRs

NFR-CONS-01.

## Out of scope

Bulk import; change history.

## Open questions

1. Who maintains products: only ADMIN or also BRAND (for their own)?
