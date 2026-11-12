# USR · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-USR-01 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-USR-02 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-USR-03 | ✅ | test: tests/integration/users.test.ts (ADR-0018: POST /api/marcas/[id]/aprovar) | 2026-11-10 |
| REQ-USR-04 | ❌ | decided (2026-11-10): stays in the backlog; the current README no longer promises this, but the API exists and the user management screen is still not implemented. See docs/architecture/adr/pendentes.md | 2026-11-10 |
| REQ-USR-05 | ✅ | test: tests/integration/users.test.ts | 2026-11-10 |
| REQ-USR-06 | ✅ | test: tests/integration/input-and-errors.test.ts (GET, PUT, DELETE of users and brand approval; order session → id) | 2026-11-11 |
| REQ-USR-07 | ◐ | test: tests/integration/input-and-errors.test.ts (the error mapper, run without a database); the end-to-end tests (404, 409 by email, 409 by brand) **were not run** (they need a database) | 2026-11-11 |
| REQ-USR-08 | ✅ | test: tests/integration/input-and-errors.test.ts (the rule applies before any database access) | 2026-11-11 |
