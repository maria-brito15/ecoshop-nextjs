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

Os usuários criados pelo seed **não conseguem entrar** (senha placeholder). Para criar um ADMIN real: `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env` e `npm run seed:admin`. Detalhes e outros defeitos conhecidos: [`docs/guides/rodar-e-testar.md`](docs/guides/rodar-e-testar.md).

## Verificar

```bash
npm run lint && npx tsc --noEmit && npm test && npm run sdd:check && npm run build
```

`npm test` precisa de Postgres e Redis (ver o guia).

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
