# 🌿 EcoShop

A showcase (catalog) of sustainable products with an AI material scanner. Full-stack portfolio project: Next.js 15, TypeScript, PostgreSQL, Redis, Docker, Azure Custom Vision and Google Gemini.

> **Scope:** EcoShop is a catalog. There is no cart, order or payment.
> **Status:** under development, not in production. What is implemented and what is missing is in [`docs/capabilities/README.md`](docs/capabilities/README.md) (written in English).

## What it does

- Catalog with search, category filter and product detail (including certifications).
- Sign-up and sign-in (JWT in an httpOnly cookie, `SameSite=lax`), user profile.
- ADMIN panel for products, categories, brands and certificates.
- **EcoScan:** upload a photo, identify the material (Azure Custom Vision) and explain its sustainability (Gemini).
- Sustainability chat API (no UI yet).

## Run

Requirements: Node 22 (`.nvmrc`), Docker.

```bash
cp .env.example .env        # fill in the REQUIRED variables (below) and, for AI, GEMINI_KEY and AZURE_VISION_*
docker compose up --build   # app at http://localhost:3000 · GET /api/health
```

No secret has a default value: without `JWT_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `ADMIN_PASSWORD` (12+ characters) and `SEED_USER_PASSWORD` (12+ characters), `docker compose up` fails naming the missing variable. `.env.example` explains how to generate each value. In development Compose also loads `docker-compose.override.yml`, which publishes Postgres and Redis on `127.0.0.1` and runs the demo seed; the ADMIN is created by `prisma/seed-admin.ts`.

Without Docker: start Postgres 16 and Redis 7, export `DATABASE_URL` and `REDIS_URL` (templates in `.env.example`), then run `npm ci && npx prisma migrate deploy && npm run dev`. To create the ADMIN outside Docker, with `ADMIN_PASSWORD` set in `.env` (or `.env.local`):

```bash
npx tsx prisma/seed-admin.ts
```

> `npm run seed:admin` **does not work**: the `seed` and `seed:admin` scripts sit under the `"prisma"` key of `package.json`, not under `"scripts"`.

See [`docs/guides/run-and-test.md`](docs/guides/run-and-test.md).

## Verify

```bash
npm run lint && npx tsc --noEmit && npm test && npm run sdd:check && npm run build
```

`npm test` needs Postgres and Redis, **using a test database** (tests create `@test.local` users); use a separate database and, preferably, another Redis db (e.g. `redis://localhost:6379/1`).

## Verified status (2026-11-10)

Snapshot in [`docs/discovery/2026-11-coleta/`](docs/discovery/2026-11-coleta) (Portuguese):

- `npm run lint`: 0 errors, 32 warnings · `npx tsc --noEmit`: clean.
- `npm test`: 47 tests (40 pass, 6 `todo`, 1 `skip`); the `todo`s cover known defects.
- **CI:** all 5 recorded GitHub Actions runs failed in the `Lint & Build` job (logs expired; cause unknown).
- `npm run sdd:check` fails **on Windows** because of path separators in the scripts (`scripts/sdd/lib.mjs`); not confirmed on Linux.
- Observed defects: `/ai-scan` is open to visitors (REQ-AUTZ-08 requires login) and the profile's viewed-products history is never written (REQ-PERF-05).
- The real Azure Custom Vision integration was not exercised (placeholder endpoint in the local environment).

## Spec-Driven Development

Project rules: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) · behavior per capability: [`docs/capabilities/`](docs/capabilities/README.md) · decisions: [`docs/architecture/adr/`](docs/architecture/adr/README.md) · workflow: [`docs/guides/sdd-flow.md`](docs/guides/sdd-flow.md) · Claude Code instructions: [`CLAUDE.md`](CLAUDE.md). The code base and the documentation are English-only (ADR-0023); `docs/discovery/` is a frozen snapshot and stays in Portuguese.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Prisma 7 + PostgreSQL 16 · Redis 7 · Zod · jose · Tailwind · GitHub Actions.

## License

Portfolio project. Free to use as a reference.
