# OPS · Operations (running, health, build and delivery)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-12. ADRs: ADR-0023 · ADR-0006 · ADR-0016 · ADR-0019 · ADR-0020

## Goal

Make the system start up reproducibly, report its health and go through checks before being delivered.

## Actors

The person who operates or develops the system.

## Business rules

- **BR-OPS-01** — Migrations are versioned in prisma/migrations and applied with migrate deploy.
- **BR-OPS-02** — CI fails if lint, types, tests, specs or build fail.

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-OPS-01 | When the health endpoint is queried, the system shall respond 200 with `status: "ok"` if the database and Redis respond, 200 with `status: "degraded"` if only Redis (optional) fails, and 503 with `status: "unavailable"` if the database fails. | GET /api/health with both up → 200 `ok`; Redis down → 200 `degraded`; database down → 503 |
| REQ-OPS-02 | When the environment comes up for the first time with Docker, the system shall create an ADMIN user for dashboard access, with the password given in `ADMIN_PASSWORD` (no embedded password; see REQ-OPS-09). | docker compose up on an empty database, with `ADMIN_PASSWORD` set, allows ADMIN login |
| REQ-OPS-03 | When the environment restarts, the system shall preserve the registered data. | docker compose up again keeps the products |
| REQ-OPS-04 | When a change is proposed, the pipeline shall run lint, types, integration tests, spec validation and build. | The CI job contains the 5 steps |
| REQ-OPS-05 | When the pipeline passes on the main branch, the system shall be published automatically to the server, using the GHCR image and the versioned compose (REQ-OPS-10/11). | Deploy after green CI |
| REQ-OPS-06 | When the application starts with `NODE_ENV=production`, the system shall refuse to start if `JWT_SECRET` is missing, has fewer than 32 characters or is a known example value. | Starting the server in production with each invalid value → exits with a clear message, without coming up; with a valid value → comes up |
| REQ-OPS-07 | The `docker-compose.yml` shall not contain a usable default value for any secret (`JWT_SECRET`, Postgres, Redis and ADMIN passwords, the password of the demo users); the lack of any of them shall prevent startup by naming the variable. | `docker compose config` without the variables → error naming the variable; no `:-` associated with a secret |
| REQ-OPS-08 | The `docker-compose.yml` shall not publish the Postgres and Redis ports on the host by default; publishing them is an explicit development choice, only on 127.0.0.1. | The base and publishing composes without `5432`/`6379` in `ports`; the development override publishes them on 127.0.0.1 |
| REQ-OPS-09 | When the seed runs, the system shall not use an embedded password: `SEED_USER_PASSWORD` and `ADMIN_PASSWORD` are required (12+ characters) and the seed fails, writing nothing, if they are missing. In production only the ADMIN is created; the demo seed runs only in development and the production catalog starts empty. | Seeds without the variable → fail before any write; the publishing compose does not reference `seed.ts` |
| REQ-OPS-10 | When the pipeline publishes a new version, the deploy shall apply the migrations before starting the new application, check health afterwards and, if it fails, go back to the previous image and fail the job. The rollback does not undo migrations: they must be compatible with the previous version. | Versioned deploy script with the order migrate → up → health → rollback |
| REQ-OPS-11 | The repository shall contain the compose used to publish (GHCR image by commit tag), so that the deploy is reproducible from it. | The deploy job uses the versioned file; `docker compose -f docker-compose.prod.yml config` is valid |
| REQ-OPS-12 | When the application responds, the system shall include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and a restrictive `Permissions-Policy`; in production, also `Strict-Transport-Security` (short, without `includeSubDomains` or `preload`). | Header configuration read in a test; HSTS only with `NODE_ENV=production` |
| REQ-OPS-13 | The base images of the Dockerfile and the composes shall be pinned by digest, with updates proposed automatically (Dependabot). | No third-party image without a digest; `.github/dependabot.yml` covers docker, docker-compose and github-actions |
| REQ-OPS-14 | When Redis is down or slow, the system shall fail fast on each command (timeout and a bounded offline queue), treating it as a cache miss, without hanging the request. | With a nonexistent Redis, `get`, `set`, `del`, scan and rate limit return in milliseconds and without error |
| REQ-OPS-15 | The rate limit shall count atomically in Redis (the key is born with an expiry) and, without Redis, shall use an in-process memory counter, keeping the limit (not letting everything through). | 3 accesses with limit 2 → the 3rd is blocked, with and without Redis; the key has a TTL |
| REQ-OPS-16 | The system shall obtain the client IP from the N-th entry, counted from the end, of `x-forwarded-for` (N = `TRUST_PROXY_HOPS`, default 1); with N = 0, ignore the header. | `9.9.9.9, 203.0.113.7` with N = 1 → `203.0.113.7` (the value forged by the client does not count) |
| REQ-OPS-17 | When several simultaneous accesses ask for the same key with an empty cache, the system shall run a single lookup against the source and share the result. | 8 concurrent calls → 1 execution of the `fetcher` |
| REQ-OPS-18 | When the application starts with `NODE_ENV=production`, the system shall refuse to start if `DATABASE_URL` is missing or is not a PostgreSQL URL, listing all configuration problems at once and without revealing values; `REDIS_URL` is optional. | Production without `DATABASE_URL` (or `mysql://…`) → exits with code 1 naming the variable |
| REQ-OPS-19 | When a route responds 500, the system shall record a structured log (one JSON line, with the context and the cause), without secrets: sensitive keys and credentials in URLs are masked; the response body carries no detail of the cause. | `ERRORS.internal(context, cause)` responds 500 and writes the `internal_error` event; `password`, `token`, `*_KEY`, `redis://:password@…` appear as `[REDACTED]` |
| REQ-OPS-20 | When a change is proposed, the pipeline shall fail if the number of lint warnings exceeds the recorded ceiling (which can only go down) and shall audit the production dependencies, failing on a high or critical vulnerability; Dependabot shall propose npm, Docker and actions updates. | CI with `eslint --max-warnings <ceiling>` and `npm audit --omit=dev --audit-level=high`; `.github/dependabot.yml` with npm |
| REQ-OPS-21 | The system shall define its database (Prisma models, tables, columns, enums) and every migration with English names only, and the migrations shall build an empty database that matches `schema.prisma` with no drift (ADR-0023). | One migration folder `*_init`; the schema and the SQL have no Portuguese name; `prisma migrate diff` on a database built from the migrations reports no difference |
| REQ-OPS-22 | The system shall use English names for API paths, page URLs, JSON keys, multipart fields, AI prompt/response fields, identifiers, messages and UI copy; the old Portuguese paths shall not exist (ADR-0023). | No Portuguese contract name in `app/`, `lib/`, `services/`, `types/`, `config/`, `prisma/`, `scripts/ops/` and `tests/`; `/api/produtos` and `/painel` answer 404 |
| REQ-OPS-23 | When the contract is renamed, the system shall keep its behavior: the same rules, validations and status codes, with the test IDs unchanged. | The whole suite passes against a database built from the single `init`; lint, `tsc`, build and the boot check pass |
| REQ-OPS-24 | The living specs, guides, `sdd.config.json`, the Claude rules and the Constitution shall cite the English names and ADR-0023. | `npm run sdd:check` passes; no living document cites a Portuguese path or field |

## Edge cases

Without Redis, cache and rate limit degrade without hanging the request (ADR-0020). The project is not in production yet (owner's answer).

- The verification of REQ-OPS-06 only runs when the server starts, not on `next build` (the Docker build does not have the secret).
- The deploy rollback (REQ-OPS-10) only swaps the application image; a migration incompatible with the previous version needs a notice in the PR.
- Until the spec that adjusts REQ-OPS-01 (Redis as an optional dependency, Constitution Art. XIII.2), `/api/health` returns 503 when only Redis goes down and the deploy rolls back in that case.
- In production the catalog starts empty; the ADMIN is created by a single explicit step (the `bootstrap` profile of the publishing compose).

## Interfaces

GET /api/health · docker-compose.yml · docker-compose.override.yml (development) · docker-compose.prod.yml · Dockerfile · scripts/deploy/deploy.sh · .github/workflows/ci.yml · instrumentation.ts.

## Applicable NFRs

NFR-OPS-01, NFR-OPS-02.

## Out of scope

Full observability (metrics, tracing).

## Open questions

Resolved on 2026-11-11 (`specs/008-safe-operation`): the target is a server over SSH with the versioned publishing compose and automatic rollback to the previous image (ADR-0019); the first ADMIN is created by `seed-admin` with a required `ADMIN_PASSWORD`.

1. Who terminates TLS on the server? The design assumes a reverse proxy outside the compose pointing to `127.0.0.1:3000`; confirm when there is a server.
2. The deploy and the rollback have not been rehearsed on a real server yet (REQ-OPS-10 stays ◐ until then).
