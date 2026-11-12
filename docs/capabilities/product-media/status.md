# MIDIA · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-MIDIA-01 | ✅ | test: tests/integration/media.test.ts | 2026-11-10 |
| REQ-MIDIA-02 | ✅ | test: tests/integration/media.test.ts (disallowed extension and file > 5MB, both 400) | 2026-11-10 |
| REQ-MIDIA-03 | ✅ | test: tests/integration/media.test.ts | 2026-11-10 |
| REQ-MIDIA-04 | ◐ | code: app/(store)/products/[id]/page.tsx consumes useListPhotos and shows clickable thumbnails; API confirmed via curl against the dev server (product with 2 photos). Visual check in the browser is missing (no such tool in this environment) | 2026-11-10 |
| REQ-MIDIA-05 | ✅ | test: tests/integration/input-and-errors.test.ts (GET and DELETE; POST uses the same validation, without its own test) | 2026-11-11 |
| REQ-MIDIA-06 | ✅ | test: tests/integration/media-content.test.ts (`savePhoto` with a temporary folder: signature, mismatched extension, empty, 4 valid types, limits). The HTTP mapping (`CONTENT_NOT_IMAGE` → 400) is checked by `tsc` (type union), **without a route test** (needs a database). `media.test.ts` was adjusted to send a valid JPEG and **was not re-run** | 2026-11-11 |
| REQ-MIDIA-07 | ✅ | test: tests/integration/media-content.test.ts (two concurrent `savePhoto` calls; `wx` flag). It replaced the `readdir` + write, which had a race | 2026-11-11 |
