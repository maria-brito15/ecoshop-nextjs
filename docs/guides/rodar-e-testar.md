# Rodar e testar

## Pré-requisitos
Node 22 (`.nvmrc`), Docker (ou Postgres 16 e Redis 7 locais).

## Rodar a aplicação
1. `cp .env.example .env` e preencha `JWT_SECRET` (≥ 32 caracteres), `GEMINI_KEY`, `AZURE_VISION_*` se for usar IA.
2. `docker compose up --build` (sobe app, Postgres e Redis; aplica migrations e seed).
3. Abra http://localhost:3000. `GET /api/health` deve responder 200.

Atenção (defeitos conhecidos, ver `docs/capabilities/operacao/status.md`): os usuários do seed têm senha placeholder e não conseguem logar (REQ-OPS-02; use `npm run seed:admin` com `ADMIN_EMAIL`/`ADMIN_PASSWORD` para criar um ADMIN real) e o seed recria produtos a cada subida (REQ-OPS-03).

## Rodar sem Docker
1. Suba Postgres e Redis; exporte `DATABASE_URL` e `REDIS_URL`.
2. `npm ci && npx prisma migrate deploy && npm run dev`.

## Testes
1. Com Postgres e Redis no ar e `DATABASE_URL`/`REDIS_URL` apontando para um banco **de teste** (os testes criam dados com e-mail `@test.local`).
2. `npx prisma migrate deploy`
3. `npm test` — espera: todos passam; testes `todo` são defeitos conhecidos.

## Verificações completas (as do CI)
`npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run sdd:check` · `npm run build`.
