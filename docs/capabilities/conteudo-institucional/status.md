# CONT · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-CONT-01 | ◐ | code: app/page.tsx; no UI test | 2026-11-10 |
| REQ-CONT-02 | ◐ | code: app/page.tsx shows "Illustrative numbers — no real data source yet" next to the metrics (REQ rewritten on 2026-11-10 to require a label, not a real source — see spec); manual check on screen is missing | 2026-11-10 |
| REQ-CONT-03 | ◐ | code: app/(educacao); no test | 2026-11-10 |
| REQ-CONT-04 | ◐ | code: app/(sobre); no test | 2026-11-10 |
| REQ-CONT-05 | ◐ | code: app/(store)/produtos/[id]/page.tsx (ImpactCard) shows "Illustrative estimate calculated from the price" (REQ rewritten on 2026-11-10, same logic as CONT-02); manual check on screen is missing | 2026-11-10 |
