# Phase 7 · Pilot: `specs/001-own-user-profile`

**Defect:** CLIENTE/MARCA did not see their own profile (D1): the middleware required ADMIN on `/api/usuarios`, but the handler already accepted "the user themselves or ADMIN".

**Path (fix track):** `todo` characterization test → spec/plan/tasks → a 1-line change in `config/protected-routes.ts` (the middleware only authenticates; the handler decides, ADR-0017) → `todo` removed → status ❌→✅ → `sdd:check` green. D8 was also fixed: the screen read `data.mensagem`, the API sends `erro`.

**What the pilot showed:** ADR-0017 (decision in the handler) made the fix safe and small; without authorization tests (AUTZ-04/05) the risk of opening `/api/usuarios` to any logged-in user would have been hard to assess.

**Pending:** manual verification of REQ-PERF-04 on screen (needs a browser).
