# Tasks: 003-photo-gallery

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | `app/(store)/produtos/[id]/page.tsx`: consume `useListPhotos`, compute `mainImage` (selection > fotoUrl > first photo) and render a strip of clickable thumbnails | REQ-MIDIA-04 | — | the code compiles (`tsc`), lint with no new error | [x] |
| T2 | Verify the API the gallery consumes (`GET /api/produtos/{id}/fotos`) against the real dev server, with a 2-photo product | REQ-MIDIA-04 | T1 | `curl` confirms `total: 2` and the correct URLs | [x] |
| T3 | Consolidate `product-media/{spec,status}.md`; remove the gallery row from `pending.md` | — | T1, T2 | `npm run sdd:check` passes | [x] |

## Note

REQ-MIDIA-04 stayed ◐, not ✅: I verified the code and the real API via `curl`, but there is no browser tool in this session to confirm visually that the thumbnails appear and swap the main image on screen (the page is client-side; the initial HTML via `curl` does not carry the post-hydration data). A `manual: YYYY-MM-DD` with a browser is missing to become ✅.
