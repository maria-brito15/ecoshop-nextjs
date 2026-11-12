# Running and testing

## Prerequisites
Node 22 (`.nvmrc`), Docker (or local Postgres 16 and Redis 7).

## Run the application
1. `cp .env.example .env` and fill in `JWT_SECRET` (≥ 32 characters), `GEMINI_KEY`, `AZURE_VISION_*` if you will use the AI.
2. `docker compose up --build` (brings up app, Postgres and Redis; applies migrations and seed).
3. Open http://localhost:3000. `GET /api/health` should respond 200.

Note (known defects, see `docs/capabilities/operations/status.md`): the seed users have a placeholder password and cannot log in (REQ-OPS-02; use `npm run seed:admin` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` to create a real ADMIN) and the seed recreates products on every start (REQ-OPS-03).

## Run without Docker
1. Bring up Postgres and Redis; export `DATABASE_URL` and `REDIS_URL`.
2. `npm ci && npx prisma migrate deploy && npm run dev`.

## Tests
1. With Postgres and Redis up and `DATABASE_URL`/`REDIS_URL` pointing to a **test** database (the tests create data with `@test.local` emails).
2. `npx prisma migrate deploy`
3. `npm test` — expected: all pass; `todo` tests are known defects.

## Full checks (the CI ones)
`npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run sdd:check` · `npm run build`.
