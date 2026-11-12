# Plan: 008-operacao-segura

- **Status:** Implemented on 2026-11-11 (the owner granted technical autonomy; G2 treated as granted). Deviations from the original plan:
  - **D1:** throwing an error in `register()` does **not** prevent the start (Next only logs and the process stays alive; discovered with the real server). It became `lib/config/verify-environment.ts`, loaded only in the `nodejs` runtime, which logs the error and calls `process.exit(1)`.
  - **D4:** the rehearsal of the deploy and of the rollback **was not done** (the Docker daemon was not active and there is no server).
  - The tests that need a database (seeds, REQ-OPS-02/03) were written but **not run**: no test database was available.
- **Spec:** `spec.md` (G1 approved on 2026-11-11)
- **ADR:** **ADR-0019** proposed, which ratifies and supersedes ADR-0013 (Inferred) with the details of REQ-OPS-10/11. It is only created after G2.

## Technical decisions

### D1. Refuse to start without a strong secret (REQ-OPS-06)

- A pure function `validateJwtSecret(value)` in `lib/config/jwt-secret.ts`: returns the error message, or `null` if valid. Rules: present, with at least 32 characters, and not containing (case-insensitively) any of these example-value fragments: `supersecretkey`, `seu-segredo`, `mude-em`, `changeme`, `sua-chave`.
- `instrumentation.ts` at the root: `register()` calls the function when `NEXT_RUNTIME === "nodejs"` and `NODE_ENV === "production"`. ~~throws an error if invalid~~ **Fixed in the implementation:** it logs the error and ends the process with `process.exit(1)` (see the status above). `next build` without `JWT_SECRET` was verified and passes; the `NEXT_PHASE` guard stays as extra protection.
- `lib/auth/jwt.ts` **does not change** (without touching the sensitive path of ADR-0007). `lib/config/` is where spec 015 will put the single environment schema; this change only creates the first file.
- `.env.example`: `JWT_SECRET=` empty, with the command to generate the value. The current example (`seu-segredo-jwt-aqui-mude-em-producao`) has 38 characters and **would pass** the length rule alone; hence the list of forbidden fragments.
- ❔ **To confirm in task T1:** that Next really aborts the server when `register()` throws. The verification is a CI step that starts the built server with each invalid secret and expects an exit with an error.
- Discarded alternative: validating inside `getSecret()`. It would only run on the first request (too late) and would mix the rule with the sensitive path.

### D2. Three compose files (REQ-OPS-07, 08, 11)

| File | Use | Content |
|---|---|---|
| `docker-compose.yml` | base and development | `app` (build), `postgres`, `redis`, `migrate`, `seed` (only `seed-admin.ts`). **No database/Redis `ports`.** Secrets with `${VAR:?message}`, no `:-` on a secret. Redis with `--requirepass`. |
| `docker-compose.override.yml` | development only (Compose loads it by itself) | publishes `5432` and `6379` on `127.0.0.1` and adds `seed-demo` (`prisma/seed.ts`, with `SEED_USER_PASSWORD`). |
| `docker-compose.prod.yml` | publishing (`-f`; ignores the override) | `app` and `migrate` by **GHCR image** (no `build`), `postgres`, `redis` with a password, the app port published only on `127.0.0.1:3000`, `seed-admin` in the `bootstrap` profile (does not run on its own). |

- Required variables: `JWT_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `ADMIN_PASSWORD`, `SEED_USER_PASSWORD` (the latter only in the override). `DATABASE_URL` and `REDIS_URL` are assembled in the compose from them.
- Passwords in the URL must be URL-safe: document the generation with `openssl rand -hex 24` or, on Windows, `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
- The Dockerfile only produces an application image at the `runner` target, which **does not have the Prisma CLI**. So CI now also publishes the `migrator` target as a second image (`…-migrator`), used by the production compose's `migrate`. Today `migrate` depends on having the source code on the server.
- ❔ **Question for G2 (Q-A):** who terminates TLS on the server (nginx, Caddy, other)? The plan assumes a proxy **outside** the compose, pointing to `127.0.0.1:3000`. If the design is different, only the published port changes.

### D3. Seeds without an embedded password (REQ-OPS-09, amendment of REQ-OPS-02)

- `prisma/seed.ts`: removes the `?? "EcoshopDemo@2026"`. Without `SEED_USER_PASSWORD` of 12+ characters, it exits with an error **before** any write.
- `prisma/seed-admin.ts`: removes the `|| "Admin@123456"` and raises the minimum from 8 to 12; fails before opening a write connection.
- The validation is the same in both (a small function shared in `prisma/`), reusing the one from `seed-admin.ts`.
- In production the ADMIN is created once, on request: `docker compose -f docker-compose.prod.yml --profile bootstrap run --rm seed-admin`. Empty catalog.
- `seed-admin.ts` today creates **or updates** the admin. It stays as is (it resets the admin's password from `.env`), but, since in the base compose it runs on every `up`, the note in the README warns that it overwrites the password of `ADMIN_EMAIL` on every start in development.
- The REQ-OPS-02/03 tests in `operations.test.ts` run the real seed; they now define `SEED_USER_PASSWORD` and gain failure cases without the variable.

### D4. Deploy with order, health and rollback (REQ-OPS-10)

- `scripts/deploy/deploy.sh` (POSIX, `set -eu`), run on the server with `APP_TAG`:
  1. saves the tag in use (the server's `.deploy/current-tag` file);
  2. `pull` of the app and migrator images;
  3. `run --rm migrate`; if it fails, **exits with an error without touching the old app**;
  4. `up -d --no-deps app` with the new tag;
  5. queries `GET http://127.0.0.1:3000/api/health` until it responds 200;
  6. if it does not respond in time: brings up the previous tag, exits with an error (the job fails);
  7. if it responds: records the new tag and cleans old images.
- Proposed deadline: 12 attempts every 5 s (60 s), aligned with the 40 s `start_period` of the current healthcheck. Values subject to G2.
- Until spec 011, `/api/health` still returns 503 when only Redis goes down. In that case the deploy rolls back, which is safe (it fails to the conservative side); spec 011 fixes the health.
- The rollback **does not undo migrations**. Rule documented in `docs/guides/` and a check box in `.github/pull_request_template.md`: "migration compatible with the previous version of the application".
- In CI, the `deploy` job swaps the third-party action `appleboy/ssh-action` for the runner's native `scp` and `ssh`, with `SSH_PRIVATE_KEY` and a **new secret `SSH_KNOWN_HOSTS`** (strict verification of the server's key). Less third-party code in the delivery chain. It copies `docker-compose.prod.yml` and `deploy.sh` and runs the script. The file with the secrets stays only on the server (`/opt/ecoshop/.env`), outside the repository.
- The `docker` job now computes the tag once (`sha-` + the first 7 characters of the commit) and passes it to `deploy` via `outputs`.

### D5. Security headers (REQ-OPS-12)

- `headers()` in `next.config.ts`, for all routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. I checked that the code uses no `getUserMedia`, `capture` or geolocation, so the restrictive policy does not break EcoScan (which sends a file through an `<input>`).
- `Strict-Transport-Security: max-age=300` **only when `NODE_ENV=production`**, without `includeSubDomains` or `preload`. The 5-minute value is the usual conservative start; increasing it is a future change.
- No CSP (the owner's decision: its own spec).

### D6. Digests and Dependabot (REQ-OPS-13)

- `FROM node:22-alpine@sha256:…` in the Dockerfile (4 stages) and `postgres`/`redis` by digest in the composes.
- **The digests will not be invented**: they are obtained on the spot with `docker buildx imagetools inspect <tag>`. If the environment has no Docker or network, task T7 stops and asks.
- `.github/dependabot.yml` with the `docker`, `docker-compose` and `github-actions` ecosystems. npm updates are left for spec 018 (avoid noise now).

## Impact and risks

- **Development experience:** `docker compose up` now requires variables in `.env`. Mitigation: a complete `.env.example`, a README with the generation commands, and the `${VAR:?…}` error message names the missing variable.
- **Sensitive paths:** `lib/redis.ts`, `lib/cache/**` and `lib/auth/**` are **not** changed; `impact-map` should list only OPS. The PR cites ADR-0019.
- **First real deploy:** the deploy and rollback scripts are only fully verifiable on a server. Until there is a rehearsal, REQ-OPS-10 stays ◐ in `status.md`, with the evidence of what was tested locally.
- **Image rollback:** it protects against an **application** failure, not a data one; the rule of compatible migrations is the counterpart.

## Verification

Static and unit tests run in `npm test`; the checks that need Docker or a build run in CI. Each requirement has its test/step in `tasks.md`. At the end: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run sdd:check`, `node scripts/sdd/impact-map.mjs --worktree`.
