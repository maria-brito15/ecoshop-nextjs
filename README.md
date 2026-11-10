# 🌿 EcoShop

Vitrine de produtos sustentáveis com um scanner de materiais por IA. Projeto full-stack de portfólio: Next.js 15, TypeScript, PostgreSQL, Redis, Docker, Azure Custom Vision e Google Gemini.

> **Escopo:** o EcoShop é um catálogo (vitrine). Não há carrinho, pedido nem pagamento.
> **Estado:** em desenvolvimento, ainda não está em produção. O que existe de fato e o que falta está em [`docs/capabilities/README.md`](docs/capabilities/README.md).

## O que faz

- Catálogo com busca, filtro por categoria e detalhe do produto (certificações incluídas).
- Cadastro e login (JWT em cookie httpOnly, `SameSite=lax`), perfil do usuário.
- Painel de ADMIN para produtos, categorias, marcas e certificados.
- **EcoScan:** envia uma foto, identifica o material (Azure Custom Vision) e explica a sustentabilidade (Gemini).
- API de chat de sustentabilidade (sem interface ainda).

## Rodar

Requisitos: Node 22 (`.nvmrc`), Docker.

```bash
cp .env.example .env        # preencha JWT_SECRET e, para IA, GEMINI_KEY e AZURE_VISION_*
docker compose up --build   # app em http://localhost:3000 · GET /api/health
```

Sem Docker: suba Postgres 16 e Redis 7, exporte `DATABASE_URL` e `REDIS_URL` e rode `npm ci && npx prisma migrate deploy && npm run dev`.

Os usuários criados pelo seed **não conseguem entrar** (senha placeholder). Para criar um ADMIN real, defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` no `.env` (ou `.env.local`) e rode:

```bash
npx tsx prisma/seed-admin.ts
```

> `npm run seed:admin` **não funciona**: os scripts `seed` e `seed:admin` estão sob a chave `"prisma"` do `package.json`, e não em `"scripts"`.

Detalhes e outros defeitos conhecidos: [`docs/guides/rodar-e-testar.md`](docs/guides/rodar-e-testar.md).

## Verificar

```bash
npm run lint && npx tsc --noEmit && npm test && npm run sdd:check && npm run build
```

`npm test` precisa de Postgres e Redis, **de um banco de teste** (os testes criam usuários `@test.local`); use um banco separado e, de preferência, outro db do Redis (ex.: `redis://localhost:6379/1`).

## Estado verificado (2026-11-10)

Retrato da coleta em [`docs/discovery/2026-11-coleta/`](docs/discovery/2026-11-coleta):

- `npm run lint`: 0 erros, 32 avisos · `npx tsc --noEmit`: limpo.
- `npm test`: 47 testes (40 ok, 6 `todo`, 1 `skip`), que cobrem defeitos conhecidos.
- **CI:** as 5 execuções registradas no GitHub Actions falharam no job `Lint & Build` (logs expirados; causa não consta).
- `npm run sdd:check` falha **no Windows** por separador de caminho nos scripts (`scripts/sdd/lib.mjs`); não foi confirmado em Linux.
- Defeitos observados: `/ia-scan` abre para visitante (REQ-AUTZ-08 pede login) e o histórico de produtos vistos do perfil nunca é gravado (REQ-PERF-05).
- A integração real com Azure Custom Vision não foi exercitada (endpoint de exemplo no ambiente local).

## Como o projeto é especificado (Spec-Driven Development)

| Para saber… | Veja |
|---|---|
| As regras do projeto | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Como o sistema deve se comportar e o que já funciona | [`docs/capabilities/`](docs/capabilities/README.md) |
| Por que foi feito assim | [`docs/architecture/adr/`](docs/architecture/adr/README.md) |
| Visão e arquitetura | [`docs/product/overview.md`](docs/product/overview.md), [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| Como propor e implementar uma mudança | [`docs/guides/fluxo-sdd.md`](docs/guides/fluxo-sdd.md), [`specs/`](specs) |
| O que cada fase ensinou | [`docs/learning/`](docs/learning) |
| Instruções para o Claude Code | [`CLAUDE.md`](CLAUDE.md), `.claude/` |

O README antigo (com afirmações que o código não sustenta) está preservado em [`docs/discovery/2026-11-baseline/`](docs/discovery/2026-11-baseline).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Prisma 7 + PostgreSQL 16 · Redis 7 · Zod · jose · Tailwind · GitHub Actions.

## Licença

Projeto desenvolvido para fins de portfólio. Livre para uso como referência.
