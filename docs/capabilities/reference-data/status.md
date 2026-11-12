# REF · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-REF-01 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-REF-02 | ✅ | test: tests/integration/catalog.test.ts (fixed: mapError uses err.code, P2002 → 409) | 2026-11-10 |
| REQ-REF-03 | ✅ | test: tests/integration/catalog.test.ts (fixed D7: the cause was checking err.message.includes("P2025") instead of err.code; now uses err.code === "P2003" → 409) | 2026-11-10 |
| REQ-REF-04 | ✅ | test: tests/integration/catalog.test.ts (decision 2026-11-10: the brand owner must be MARCA or ADMIN; brand.service.ts validates before creating) | 2026-11-10 |
| REQ-REF-05 | ✅ | test: tests/integration/input-and-errors.test.ts (3 resources × 3 methods; `parseId` tested separately) | 2026-11-11 |
