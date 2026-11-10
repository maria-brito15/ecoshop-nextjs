# ADR-0006: PostgreSQL com Prisma 7 e driver adapter `pg`

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: todas

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `prisma/schema.prisma`, `lib/db.ts` (`PrismaPg` + `pg.Pool`), `prisma.config.ts`, imagem `postgres:16-alpine`.

## Problema
Qual banco e acesso a dados?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Postgres + Prisma (atual) | Tipagem forte, migrations | Cliente gerado, peso do Prisma | — |
| B. Drizzle | SQL mais explícito | Reescrever services | — |

## Decisão
Ratificar A.

## Justificativa
Combina com o domínio relacional (FKs, unicidade).

## Consequências
Dependência do `prisma generate` no build e no CI. Afeta: `prisma/**`, `lib/db.ts`.

## Verificação
`prisma migrate deploy` nos testes e no CI.
