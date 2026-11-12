# AUTH · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-AUTH-01 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-02 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-03 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-04 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-05 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-06 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-07 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-08 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-09 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-10 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-11 | ✅ | test: tests/integration/authentication.test.ts (ADR-0018: sign-up as MARCA stays CLIENTE + Marca PENDENTE) | 2026-11-10 |
| REQ-AUTH-12 | ◐ | code: lib/schemas/user.ts (min 8); no automated test | 2026-11-10 |
| REQ-AUTH-13 | ❔ | pending ADR P02: today the token is valid for up to 7 days | 2026-11-10 |
| REQ-AUTH-14 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-AUTH-15 | ◐ | test: tests/integration/input-and-errors.test.ts (schemas of the 3 flows, run without a database); the tests for duplicate sign-up in another case and for login of an old account **were not run** (they need a database) | 2026-11-11 |
| REQ-AUTH-16 | ✅ | test: tests/integration/input-and-errors.test.ts (public sign-up, admin sign-up and update; counts bytes) | 2026-11-11 |
| REQ-AUTH-17 | ◐ | test: tests/integration/input-and-errors.test.ts (`localPathOrRoot`, 14 inputs); the screen `app/(auth)/sign-in/page.tsx` uses the function (checked by `tsc`), **no UI test** | 2026-11-11 |
| REQ-AUTH-18 | ✅ | test: tests/integration/session.test.ts | 2026-11-11 |
| REQ-AUTH-19 | ◐ | test: tests/integration/session.test.ts (service with an in-memory store, single use, concurrency, role re-read, Redis down; REAL store in Redis: hash only, expiry, GETDEL, revocation). The full cycle over HTTP (login → cookies → refresh) **was not run** (needs a database). The 15 min duration is an initial value without measurement | 2026-11-11 |
| REQ-AUTH-20 | ◐ | test: tests/integration/session.test.ts (logout, revoke all, never throws). Revocation on password change and user deletion is in the code (`user.service`) **without an end-to-end test** (needs a database) | 2026-11-11 |
| REQ-AUTH-21 | ◐ | test: tests/integration/session.test.ts (403 mapping and schema run); the per-route test (403 without the current password, 200 with it, ADMIN exempt) **was not run** (needs a database). The current profile screen has no password field, so the rule does not break the interface | 2026-11-11 |
| REQ-AUTH-22 | ✅ | test: tests/integration/session.test.ts (real middleware, with and without a refresh cookie) | 2026-11-11 |
| REQ-AUTH-23 | ◐ | test: tests/integration/session.test.ts (**not run**: needs a database; measures time, may be sensitive to noise) | 2026-11-11 |
