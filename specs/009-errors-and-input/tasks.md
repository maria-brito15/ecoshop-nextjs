# Tasks: 009-errors-and-input

- **Status:** Implemented on 2026-11-11, **without commits**. Result per requirement in the capabilities' `status.md`. **Not run:** the tests that need a database (5 of `input-and-errors.test.ts`, plus the existing `ecoscan.test.ts` and `chat-ai.test.ts`, which use a database in the helpers), because no test database was available; 22 of the 27 new tests were run and pass. ADR-0012 (`lib/ai/**`) must be cited in the PR.

| # | Task | REQ | Done when |
|---|---|---|---|
| T1 | `lib/errors/domain.ts` + `mapError`; services throw typed errors; handlers without `err.message` | REQ-USR-07 | the mapper tests pass; `grep "err.message"` in `app/api` is empty |
| T2 | `parseId`, `routeId` and use in all `[id]` routes | REQ-CAT-09, PROD-06, MIDIA-05, REF-05, USR-06 | `abc`, `0`, `-1`, `1.5`, `1e3` → 400 on each route |
| T3 | `emailSchema` and the password schema; case-insensitive lookup; P2002 capture | REQ-AUTH-15, AUTH-16, USR-07 | the schema tests pass; the tests with a database written |
| T4 | ADMIN self-deletion → 409 | REQ-USR-08 | test written (needs a database) |
| T5 | `localPathOrRoot` on the login screen | REQ-AUTH-17 | the function's tests pass |
| T6 | Chat: `historico` limits, `generateWithHistory`, key in the header | REQ-CHAT-08, CHAT-09 | the tests pass |
| T7 | `fetchWithTimeout` in the providers; `generateText` without throwing | REQ-SCAN-09, SCAN-05 | the tests pass; the `todo` of REQ-SCAN-05 removed |
| T8 | Living specs, status and `sdd:check` | all | `sdd:check`, lint and `tsc` green |
