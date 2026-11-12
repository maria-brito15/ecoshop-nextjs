# AUTZ · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-AUTZ-01 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-02 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-03 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-04 | ✅ | test: tests/integration/authorization.test.ts (list 401/403; POST with type ADMIN: visitor 400, CUSTOMER 400, ADMIN 201) | 2026-11-12 |
| REQ-AUTZ-05 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-06 | ✅ | test: tests/integration/profile-and-middleware.test.ts (the matcher is `/api/users/:path+`, so the collection stays reachable for public sign-up) | 2026-11-12 |
| REQ-AUTZ-07 | ✅ | test: tests/integration/authorization.test.ts (regression guard by static analysis of app/api/**/route.ts; ADR-0017 decided that the policy lives in the handler, not in a central table — this test covers the lack of one) | 2026-11-10 |
| REQ-AUTZ-08 | ✅ | test: tests/integration/profile-and-middleware.test.ts (decision 2026-11-10: require login; config/protected-routes.ts and middleware.ts protect /ai-scan) | 2026-11-10 |
