# 🌿 EcoShop

A showcase (catalog) of sustainable products with an AI material scanner. Full-stack portfolio project: Next.js 15, TypeScript, PostgreSQL, Redis, Docker, Azure Custom Vision and Google Gemini.

> **Scope:** EcoShop is a catalog. There is no cart, order or payment.
> **Status:** under development, not in production. What is implemented and what is missing is in [`docs/capabilities/README.md`](docs/capabilities/README.md) (written in Portuguese).

## What it does

- Catalog with search, category filter and product detail (including certifications).
- Sign-up and sign-in (JWT in an httpOnly cookie, `SameSite=lax`), user profile.
- ADMIN panel for products, categories, brands and certificates.
- **EcoScan:** upload a photo, identify the material (Azure Custom Vision) and explain its sustainability (Gemini).
- Sustainability chat API (no UI yet).

## Run

Requirements: Node 22 (`.nvmrc`), Docker.

```bash
cp .env.example .env        # set JWT_SECRET and, for AI, GEMINI_KEY and AZURE_VISION_*
docker compose up --build   # app at http://localhost:3000 · GET /api/health
```

Users created by the seed **cannot sign in** (placeholder password). To create a real ADMIN: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` and run `npm run seed:admin`. See [`docs/guides/rodar-e-testar.md`](docs/guides/rodar-e-testar.md) (Portuguese).

## Verify

```bash
npm run lint && npx tsc --noEmit && npm test && npm run sdd:check && npm run build
```

`npm test` needs Postgres and Redis.

## Spec-Driven Development

Project rules: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) · behavior per capability: [`docs/capabilities/`](docs/capabilities/README.md) · decisions: [`docs/architecture/adr/`](docs/architecture/adr/README.md) · workflow: [`docs/guides/fluxo-sdd.md`](docs/guides/fluxo-sdd.md) · Claude Code instructions: [`CLAUDE.md`](CLAUDE.md). Project documentation is in Portuguese.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Prisma 7 + PostgreSQL 16 · Redis 7 · Zod · jose · Tailwind · GitHub Actions.

## License

Portfolio project. Free to use as a reference.
