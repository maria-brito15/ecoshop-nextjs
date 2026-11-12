# Tasks: 007-historico-e-metricas-reais

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | `app/(store)/produtos/[id]/page.tsx`: writes `ecoshop_history` (dedup, most recent first, cut at 50) | REQ-PERF-05 | — | logic verified by simulation in Node (dedup/order/limit) | [x] |
| T2 | `app/(perfil)/perfil/page.tsx`: reads the complete list; the History tab renders the real items | REQ-PERF-05 | T1 | the code compiles (`tsc`), lint with no new error | [x] |
| T3 | `ImpactCard` gains `fonte`; the 3 metrics declare the source (real or illustrative estimate) | REQ-PERF-06 | T2 | no metric without `fonte` | [x] |
| T4 | Consolidate `conta-e-perfil/{spec,status}.md`; remove the backlog row from `pendentes.md` | — | T1–T3 | `npm run sdd:check` passes | [x] |

## Note

REQ-PERF-05/06 stay ◐, not ✅: the core logic (writing, dedup, order, limit) was verified by simulation in Node outside React, and there is no component suite in the project to test the rendering automatically. A manual check in the browser (unavailable in this session) is missing to confirm that the History tab and the Impact captions appear as expected on screen.
