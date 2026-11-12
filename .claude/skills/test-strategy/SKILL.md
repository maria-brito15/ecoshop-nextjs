---
name: test-strategy
description: Use when writing or reviewing EcoShop tests: link a test to a REQ, pick the level, treat known defects as characterization and keep the suite deterministic.
---

# Test strategy (ADR-0016)

- Location: `tests/integration/*.test.ts`, `node:test` via `tsx`, against real Postgres and Redis; Azure and Gemini with `stubFetch`.
- Title: `test("REQ-XXX-NN: observable behavior", …)`. `trace-check` links REQ ↔ test ↔ `status.md`.
- First import: `./helpers` (sets the environment). Call `closeConnections` in `after`.
- Unique data per run: `email("name")`; a fresh IP per request (`newIp`) so rate limits do not collide; `clearRateLimit()` when the test counts attempts.
- Known defect: `test("REQ-…", { todo: "reason" }, …)` describes the CORRECT behavior and stays pending; remove the `todo` in the commit that fixes it.
- Manual verification: `skip` + `manual: YYYY-MM-DD …` evidence in `status.md`.
- Order: happy path, each business rule, errors (400/401/403/404/409/429/5xx), limits.
- Do not test the implementation; test the status, body and effect on the database.
