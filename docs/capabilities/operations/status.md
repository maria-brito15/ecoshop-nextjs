# OPS · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-OPS-01 | ◐ | test: tests/integration/redis-and-cache.test.ts (the composition rule `buildHealthReport`, 4 combinations); tests/integration/operations.test.ts (both up → 200) **was not re-run** (needs a database). Amended on 2026-11-11: Redis down = 200 `degradado` | 2026-11-11 |
| REQ-OPS-02 | ◐ | test: tests/integration/operations.test.ts (seed with a real bcrypt hash; amended on 2026-11-11 to have no embedded password — the test now provides `SEED_USER_PASSWORD`, but **was not run** in 008: no test database was available) | 2026-11-11 |
| REQ-OPS-03 | ✅ | test: tests/integration/operations.test.ts (fixed D5: prisma/seed.ts only creates products if the catalog is empty; it never deletes again) | 2026-11-10 |
| REQ-OPS-04 | ◐ | code: .github/workflows/ci.yml rewritten on 2026-11-10; not yet run on GitHub | 2026-11-10 |
| REQ-OPS-05 | ◐ | code: .github/workflows/ci.yml (docker and deploy jobs rewritten in 008: image + migrator on GHCR, deploy via ssh/scp with `scripts/deploy/deploy.sh`); **never run on GitHub or on a server** | 2026-11-11 |
| REQ-OPS-06 | ✅ | test: tests/integration/operations-delivery.test.ts (rule and `register()`); manual: 2026-11-11 `node scripts/ops/check-boot.mjs` against the real standalone server — with a missing, short and example-value secret it exits with code 1; with a valid secret it starts. Finding: Next only logs an error thrown in the hook and keeps the process alive, so `register()` calls `process.exit(1)` (`lib/config/verify-environment.ts`). `next build` without `JWT_SECRET` passes | 2026-11-11 |
| REQ-OPS-07 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 `docker compose config` without the variables fails naming `POSTGRES_PASSWORD`, with them it validates (base+override, base, prod) | 2026-11-11 |
| REQ-OPS-08 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 `docker compose config` of the base only publishes port 3000 | 2026-11-11 |
| REQ-OPS-09 | ◐ | test: tests/integration/operations-delivery.test.ts (fails without writing, ADMIN creation, absence of a password in the code) — the ones that need a database **were not run** (no test database); manual: 2026-11-11 `seed.ts` and `seed-admin.ts` with a missing or 11-character password exit with code 1 before touching the database (verified with an unreachable `DATABASE_URL`) | 2026-11-11 |
| REQ-OPS-10 | ◐ | test: tests/integration/operations-config.test.ts (order migrate → up → health → rollback, `set -eu`, ssh/scp with a verified host, no `appleboy`); **the script was never run and the rollback was not rehearsed**, neither locally (the Docker daemon was not active) nor on a server | 2026-11-11 |
| REQ-OPS-11 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 `docker compose -f docker-compose.prod.yml config` validates with the variables and fails without them. The CI `docker` job that publishes the `migrator` image was not run | 2026-11-11 |
| REQ-OPS-12 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 real standalone server, `/about` and `/api/health` return the 4 headers and `Strict-Transport-Security: max-age=300` in production | 2026-11-11 |
| REQ-OPS-13 | ✅ | test: tests/integration/operations-config.test.ts (Dockerfile and compose by digest; `.github/dependabot.yml`); digests obtained with `docker buildx imagetools inspect` on 2026-11-11; Dependabot has not been enabled on GitHub yet | 2026-11-11 |
| REQ-OPS-14 | ✅ | test: tests/integration/redis-and-cache.test.ts (child process with a nonexistent Redis: operations in milliseconds; `withTimeout`). Timeouts (300 ms; scan 3 s) are initial values without measurement | 2026-11-11 |
| REQ-OPS-15 | ✅ | test: tests/integration/redis-and-cache.test.ts (count in Redis with a TTL, in-memory reservation, expiring window; a child process without Redis blocks the 2nd access) | 2026-11-11 |
| REQ-OPS-16 | ✅ | test: tests/integration/redis-and-cache.test.ts (1, 2 and 0 proxies; forged value; `TRUST_PROXY_HOPS`). Depends on the real reverse proxy appending the IP to `x-forwarded-for` ❔ | 2026-11-11 |
| REQ-OPS-17 | ✅ | test: tests/integration/redis-and-cache.test.ts (8 concurrent calls; a failure does not get stuck) | 2026-11-11 |
| REQ-OPS-18 | ✅ | test: tests/integration/operations-delivery.test.ts (4 invalid URLs, all problems together, optional Redis); the valid case also runs in the real boot test (`scripts/ops/check-boot.mjs`, CI) | 2026-11-11 |
| REQ-OPS-19 | ✅ | test: tests/integration/log.test.ts (JSON, deep redaction, URLs, serialized error, `ERRORS.internal`, rate limiter). The 36 `ERRORS.internal` points in `app/api` pass the cause; 2 `default` branches of a `switch` in `fotos` have no cause | 2026-11-11 |
| REQ-OPS-20 | ◐ | code: .github/workflows/ci.yml (ceiling of 16 warnings, today lint has 16; before it was 33) and .github/dependabot.yml (npm). **The audit is `continue-on-error`**: on 2026-11-11 it found 15 vulnerabilities in production dependencies (1 critical in `next`, 11 high: prisma, zod, postcss, sharp, hono and others), almost all with a non-breaking fix via `npm audit fix`, which swaps many dependencies and **was neither applied nor validated**. None of this was run on GitHub | 2026-11-11 |
