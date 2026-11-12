# CAT · Product catalog (storefront)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-11. ADRs: ADR-0004 · ADR-0009 · ADR-0018

## Goal

Let visitors find sustainable products and see their details and certifications.

## Actors

Visitor · CUSTOMER · BRAND · ADMIN (all can read).

## Business rules

- **BR-CAT-01** — Price is a positive decimal with 2 places and is shown as a number.
- **BR-CAT-02** — The catalog is a storefront: there is no cart, order or payment (out of scope).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-CAT-01 | When a visitor opens the catalog, the system shall list products in pages of 12 items, with the total number of results. | GET /api/products?name=X → total 14, 12 items on page 1, 2 on page 2 |
| REQ-CAT-02 | When the visitor provides a search term, the system shall return only products whose name contains the term, case-insensitively. | An uppercase search finds the 14 products |
| REQ-CAT-03 | When the visitor filters by category, the system shall return only its products. | categoryId=N → only products of category N |
| REQ-CAT-04 | If the requested product does not exist, the system shall respond 404. | GET /api/products/99999999 → 404 |
| REQ-CAT-05 | If page or size are invalid or size exceeds 100, the system shall respond 400. | size=1000 → 400; page=abc → 400 |
| REQ-CAT-06 | When the visitor sorts by price or name, or caps the maximum price, the system shall apply the sort and the cap to the whole catalog, not only to the displayed page. | Sorting by ascending price → the first item on page 1 is the cheapest of all |
| REQ-CAT-07 | When the visitor filters by brand, the system shall return only its products. | brandId=N → only products of brand N |
| REQ-CAT-08 | When the visitor opens a product, the system shall show its name, description, price, category, brand and certificates. | GET /api/products/[id] includes category, brand and certificates |
| REQ-CAT-09 | If the `id` of `GET /api/products/[id]` is not a positive integer, the system shall respond 400. | `abc`, `0`, `-1`, `1.5`, `1e3`, `2147483648` → 400 (not 500) |
| REQ-CAT-10 | The system shall build the listing cache key from the validated filters, in a fixed order and only with the known parameters (the `name` search ignores case and trims the ends and has at most 100 characters; more than that → 400). | The order of the parameters and unknown parameters do not change the key; a 101-character `name` → 400 |

## Edge cases

A product without a photo shows a placeholder (empty photoUrl). The list is cached for 2 min (NFR-CONS-01). The admin dashboard asks for size=100 (the limit in REQ-CAT-05 must accommodate it).

## Interfaces

GET /api/products?page&size&name&categoryId&brandId&maxPrice&sort · GET /api/products/[id] · pages /products and /products/[id].

## Applicable NFRs

NFR-DES-01, NFR-CONS-01.

## Out of scope

Cart, order, payment, stock, reviews.

## Open questions

None. REQ-CAT-06 and REQ-CAT-07 were implemented on 2026-11-11 (`specs/005-brand-filter-and-price-sort/spec.md`).
