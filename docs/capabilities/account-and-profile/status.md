# PERF · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-PERF-01 | ✅ | test: tests/integration/profile-and-middleware.test.ts | 2026-11-10 |
| REQ-PERF-02 | ✅ | test: tests/integration/profile-and-middleware.test.ts | 2026-11-10 |
| REQ-PERF-03 | ✅ | test: tests/integration/profile-and-middleware.test.ts | 2026-11-10 |
| REQ-PERF-04 | ◐ | code: app/(profile)/profile/page.tsx reads data.error (fixed in specs/001, 2026-11-10); manual check on screen is missing | 2026-11-10 |
| REQ-PERF-05 | ◐ | code: app/(store)/products/[id]/page.tsx writes `ecoshop_history` (dedup, most recent first, limit 50); app/(profile)/profile/page.tsx renders the list. Write logic verified by simulation in Node; manual check in the browser is missing | 2026-11-11 |
| REQ-PERF-06 | ◐ | code: app/(profile)/profile/page.tsx (`ImpactCard` with `source`) — "Explorador Verde" (label as in the code) is a real count; the other two metrics declare the formula as an illustrative estimate (same pattern as REQ-CONT-02/05). Manual check on screen is missing | 2026-11-11 |
