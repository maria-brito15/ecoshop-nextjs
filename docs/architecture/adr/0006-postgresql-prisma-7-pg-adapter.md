# ADR-0006: PostgreSQL with Prisma 7 and the `pg` driver adapter

- Status: Inferred
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: all

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `prisma/schema.prisma`, `lib/db.ts` (`PrismaPg` + `pg.Pool`), `prisma.config.ts`, image `postgres:16-alpine`.

## Problem
Which database and data access?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Postgres + Prisma (current) | Strong typing, migrations | Generated client, Prisma's weight | — |
| B. Drizzle | More explicit SQL | Rewriting services | — |

## Decision
Ratify A.

## Rationale
It fits the relational domain (FKs, uniqueness).

## Consequences
Dependence on `prisma generate` in the build and in CI. Affects: `prisma/**`, `lib/db.ts`.

## Verification
`prisma migrate deploy` in the tests and in CI.
