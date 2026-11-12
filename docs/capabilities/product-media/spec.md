# MIDIA · Product media (photos)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0011

## Goal

Let an ADMIN attach and remove photos of a product, and let the storefront show them.

## Actors

ADMIN (write) · everyone (read).

## Business rules

- **BR-MIDIA-01** — The photo is stored on the local filesystem (`public/data_photos/`, prefix `{productId}_`) and served as a static file (ADR-0011, ratified on 2026-11-10). The previous text of this rule said "database as bytes" — that was never in the code; it was the wrong spec, fixed together with the ADR.
- ~~BR-MIDIA-02 — Each product has at most one main photo.~~ Removed on 2026-11-10: it was never true in the code, which always accepted several photos per product (it is 1:N through the file name prefix).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-MIDIA-01 | When an ADMIN uploads a valid image for a product, the system shall store it and make it accessible by URL. | POST on /api/products/[id]/photos → 201 and a GET of the URL returns the image |
| REQ-MIDIA-02 | If the uploaded file is not an allowed image or exceeds the size limit, the system shall refuse it with 400. | A .txt file → 400; a file above the limit → 400 |
| REQ-MIDIA-03 | When an ADMIN removes a photo, the system shall delete it and stop showing it. | DELETE → 200 and the URL starts responding 404 |
| REQ-MIDIA-04 | When the product has several photos, the system shall show the gallery on the product page. | A product with 3 photos shows 3 thumbnails |
| REQ-MIDIA-05 | If the `id` of the photo routes is not a positive integer, the system shall respond 400. | `1.5`, `abc`, `0`, `-3`, `1e3` → 400 on GET and DELETE |
| REQ-MIDIA-06 | If the content of the uploaded file is not a JPEG, PNG, GIF or WebP image (signature of the first bytes), or does not match the file name extension, the system shall respond 400 and write nothing. | `fake.png` with HTML, `.jpg` with PNG content and an empty file → 400 (CONTENT_NOT_IMAGE) |
| REQ-MIDIA-07 | If two simultaneous uploads use the same name, the system shall write only one and respond 409 to the other, without overwriting. | Two concurrent writes of `<id>_capa.png` → 1 file, 1 response 409 |

## Edge cases

Photos in the database increase its size and the backup cost (NFR-DES-01 to be verified). Changing the main photo is not specified.

## Interfaces

/api/products/[id]/photos (+ subroutes) · dashboard (Products tab).

## Applicable NFRs

NFR-DES-01.

## Out of scope

Automatic resizing; CDN.

## Open questions

1. ~~Is a photo in the database still adequate, or should we migrate to object storage?~~ Decided (2026-11-10): keep the local filesystem (it was never "in the database" — see BR-MIDIA-01). ADR-0011 ratified as Accepted. Revisit if the deploy becomes multi-instance.
2. The gallery (REQ-MIDIA-04) was implemented on 2026-11-10 (`specs/003-photo-gallery/spec.md`); only the visual check in the browser is missing (that tool was not available in the session that implemented it).
