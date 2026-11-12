# Change spec: 008-safe-operation

- **Track:** fix with a rule change (the Constitution Art. XII and XIII already require the behavior; REQ-OPS-01 and REQ-OPS-02 of the living spec need an amendment)
- **Affected capabilities:** OPS (`docs/capabilities/operations`); touches `lib/auth/jwt.ts` (AUTH, sensitive path ADR-0007) only to validate the secret, without changing the ADR's decision
- **Status:** Implemented on 2026-11-11 and consolidated in `docs/capabilities/operations` (G1: the owner followed the recommendations, the target serves HTTPS, empty catalog in production). Pending: run the tests with a database and rehearse the deploy/rollback (REQ-OPS-02/09/10 stay ◐); G4 (PR review).
- **Author / approver:** Claude / project owner · **Date:** 2026-11-11

## Problem

The audit of 2026-11-11 found, in what the repository delivers to run and publish the system, behaviors that the Constitution already forbids (Art. XII.1, XIII.2, X.2) or that make delivery non-reproducible. Whoever copies this repository to a server inherits these behaviors.

## Out of scope

- Session, token revocation and password policy → spec 010 (supersedes ADR-0007; the owner's decisions of 2026-11-11 already recorded).
- Redis, rate limit, cache key and **`/api/health` separating required from optional dependency** (Art. XIII.2, amendment of REQ-OPS-01) → spec 011.
- A single environment-variable schema for the whole application (Art. XII.2) and the logger (Art. XIII.1) → spec 015. This spec only validates `JWT_SECRET` and the compose secrets.
- Product media, front end, unit tests and the other audit findings → their own specs.
- Any product behavior change (catalog, profile, dashboard).

## Current behavior (fact, with evidence)

- `docker-compose.yml`, `app` service: `JWT_SECRET: ${JWT_SECRET:-supersecretkeychangeinproduction}` — without the variable, the application starts with a public secret; whoever knows it forges an ADMIN token. Violates Art. XII.1.
- `lib/auth/jwt.ts`, `getSecret()` (~line 46): only fails if the variable is empty, and only on first use; it does not require a minimum length or refuse example values.
- `docker-compose.yml`: `POSTGRES_PASSWORD: ecoshop` and `DATABASE_URL` with the same password, fixed in the file; ports `5432` and `6379` published on the host; Redis without a password.
- `prisma/seed.ts:56`: `SEED_USER_PASSWORD ?? "EcoshopDemo@2026"`, and the seed creates an `ADMIN` user with that password. The compose runs this seed on first start (`seed` is a dependency of `app`). `prisma/seed-admin.ts:45`: `ADMIN_PASSWORD || "Admin@123456"`.
- `.github/workflows/ci.yml`, `deploy` job: runs `docker compose up -d --no-deps app` **before** `docker compose run --rm migrate`; there is no health check after the deploy nor a return to the previous version. The same script does `docker compose pull app`, but the `app` service in `docker-compose.yml` only has `build:` (no `image:`), so the `pull` does not bring the image published on GHCR. The compose actually used on the server (`/opt/ecoshop`) is not in the repository (owner's answer: the server does not use this compose).
- `next.config.ts`: defines no security headers.
- Base images (`node:22-alpine`, `postgres:16-alpine`, `redis:7-alpine`) referenced by a floating tag.
- `docs/capabilities/operations/spec.md`: "The project is not in production yet (owner's answer)".

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-OPS-06 | When the application starts with `NODE_ENV=production`, the system shall refuse to start if `JWT_SECRET` is missing, has fewer than 32 characters or is a known example value. | Starting the server in production with each invalid value → exits with a clear message, without coming up. With a valid value → comes up. | New (Art. XII.1) |
| REQ-OPS-07 | The `docker-compose.yml` file shall not contain a usable default value for any secret (`JWT_SECRET`, Postgres password, Redis password, admin and demo users' password); the lack of any of them shall prevent startup with a message naming the variable. | `docker compose config` without the variables → error naming the variable; no occurrence of `:-` associated with a secret. | New (Art. XII.1) |
| REQ-OPS-08 | The `docker-compose.yml` shall not publish the Postgres and Redis ports on the host by default; publishing them is an explicit choice for development. | The base `docker compose config` lists neither `5432` nor `6379` in `ports`; the development override lists them. | New |
| REQ-OPS-09 | When the seed runs, the system shall not use a password embedded in the code: `SEED_USER_PASSWORD` and `ADMIN_PASSWORD` become required and the seed fails, writing nothing, if they are missing or have fewer than 12 characters. In production only the ADMIN is created (`seed-admin`); the demo seed (users, brands, products) runs only in development, and the production catalog starts empty. | Running `seed.ts` and `seed-admin.ts` without the variable → fails before any write; with it → current behavior, without deleting data. The publishing compose does not reference `seed.ts`. | Changes REQ-OPS-02 |
| REQ-OPS-10 | When the pipeline publishes a new version, the deploy shall apply the migrations **before** starting the new application, check the application's health afterwards and, if the check fails, go back to the previous image and mark the job as failed. | Versioned deploy script, with the order migrate → up → check → (roll back); a static test of the order; a manual failure rehearsal recorded in `status.md`. | Changes REQ-OPS-05 |
| REQ-OPS-11 | The repository shall contain the compose used to publish (referencing the GHCR image by commit tag), so that the deploy is reproducible from the repository. | The deploy job uses the versioned file; `docker compose -f … config` is valid. | New |
| REQ-OPS-12 | When the application responds to a request, the system shall include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and a restrictive `Permissions-Policy`; in production it shall also include `Strict-Transport-Security` (without `includeSubDomains` or `preload` in this change). | A test reads the header configuration; `Strict-Transport-Security` present with `NODE_ENV=production` and absent outside it. | New |
| REQ-OPS-13 | The base images of the Dockerfile and the compose shall be pinned by digest, with an automatic update proposed by a dependency tool. | No image reference without a digest; updater configuration in the repository. | New |

## Scenarios and edge cases

- `next build` runs with `NODE_ENV=production` and, in the Docker build stage, without `JWT_SECRET`: the check of REQ-OPS-06 **cannot** run on module import or at build; only when the server starts.
- Local development and tests (`NODE_ENV` different from `production`): keep working with the `.env`/test-helper values; `.env.example` carries example values marked "development only".
- A migration with a change incompatible with the previous version of the application: the return to the previous image (REQ-OPS-10) **does not undo the migration**. Rule: migrations must be compatible with the previous version of the application (add before removing). An incompatible migration requires a notice in the PR.
- Failure of the migration step itself in the deploy: the old application is not touched.
- HSTS: the owner confirmed that the target serves HTTPS. As it is hard to undo, it enters with a short validity, without `includeSubDomains` and without `preload`; increasing the validity is a future change, after confirming that all paths work over HTTPS. Over HTTP the browser ignores the header.
- Creating the ADMIN in production is a single, explicit step (it does not run on every deploy), and the production catalog starts empty.

## Business rules and constraints

- Constitution Art. XII.1 (no default secret; refuse to start in production), X.2 (the seed does not destroy data; idempotent), XIII.2 (health — out of scope here, goes in 011).
- No real credential enters the repository; `.env.example` only carries blanks and example values.
- ADR-0013 (delivery by image on GHCR and VPS via SSH) has status **Inferred**, not Accepted: the plan (G2) proposes a new ADR that ratifies and supersedes it with the details of REQ-OPS-10/11.

## Affected interfaces

`docker-compose.yml` (+ a development file and a publishing file) · `Dockerfile` · `docker-entrypoint.sh` · `.github/workflows/ci.yml` · `prisma/seed.ts` · `prisma/seed-admin.ts` · `.env.example` · `next.config.ts` · server start-up point (`instrumentation.ts`, defined in the plan) · `.github/dependabot.yml` · deploy script. `lib/auth/**` (a sensitive path of ADR-0007) is **not** changed.

## Delta in the living spec

`operations/spec.md`: amendment of REQ-OPS-02 (required passwords) and REQ-OPS-05 (order, health, rollback); new REQ-OPS-06 to 13; resolves open questions 1 and 2 of the living spec. `operations/status.md`: new rows with evidence. `README.md`: instructions for required variables.

## Owner's decisions at G1 (2026-11-11)

1. A versioned publishing compose in the repository (`docker-compose.prod.yml`, GHCR image) → REQ-OPS-11.
2. The target serves HTTPS → HSTS enters REQ-OPS-12.
3. Content-Security-Policy stays **out** of this spec; it becomes its own spec, starting in report-only mode (Next injects inline scripts and a useful CSP requires a per-request nonce).
4. Dependabot updates the digests → REQ-OPS-13.
5. Production starts with an empty catalog and only the ADMIN → REQ-OPS-09.

## Open questions

None blocks G1. The implementation ones (who terminates TLS, deploy timing values) are in `plan.md` for G2.
