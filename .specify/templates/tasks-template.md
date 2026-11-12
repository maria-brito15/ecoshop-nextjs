# Tasks: <NNN-short-name>

Rule: one task per commit; the commit message carries the task ID. A failing test comes before the fix.

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | Write a failing test for REQ-XXX-NN | REQ-XXX-NN | — | the test exists and fails for the right reason | [ ] |
| T2 | Implement | REQ-XXX-NN | T1 | the T1 test passes; lint/types ok | [ ] |
| T3 | Consolidate the living spec and status | — | T2 | `npm run sdd:check` passes; a ✅ status cites the test | [ ] |
