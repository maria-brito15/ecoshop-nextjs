# Tasks: 001-perfil-proprio-usuario

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | Characterization test of REQ-PERF-01 (marked `todo` with D1) | REQ-PERF-01 | — | the test exists and fails for the right reason (403 from the middleware) | [x] |
| T2 | Make `/api/usuarios` `autenticado` in the middleware | REQ-PERF-01, REQ-AUTZ-06 | T1 | `todo` removed and the test passes; AUTZ-04/05/06 keep passing | [x] |
| T3 | Fix `data.mensagem` → `data.erro` on the profile screen | REQ-PERF-04 | — | the code reads `erro`; tsc and lint ok | [x] |
| T4 | Manual check of REQ-PERF-04 in the interface | REQ-PERF-04 | T3 | `status.md` with `manual: YYYY-MM-DD …` | [ ] pending (needs a browser and an account) |
| T5 | Consolidate the living spec and status | — | T2, T3 | `npm run sdd:check` passes | [x] |
