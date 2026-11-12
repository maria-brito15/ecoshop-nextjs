# ADR-0005: Handler → service → Prisma layers, organized by technical folder

- Status: Inferred
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: all

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `app/api/**/route.ts` calls `services/*.service.ts`, which use `lib/db`; schemas in `lib/schemas`. Exceptions: `api/auth`, `api/auth/me`, `api/auth/refresh`, `api/users` and `api/health` use Prisma directly.

## Problem
Where does each responsibility live?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Layers by technical folder (current) | Simple to navigate | Domain spread across folders | — |
| B. Vertical modules by domain | Cohesion per capability | Large reorganization | — |

## Decision
Ratify A, with the Constitution rule (Art. V): a handler does not access Prisma. The existing exceptions are recorded debt (lint at "warn").

## Rationale
The convention is already followed in 12 of the 17 handlers; fixing it prevents erosion.

## Consequences
Migrating the handlers that violate it is a future change spec. Affects: `app/api/**`, `services/**`.

## Verification
ESLint `no-restricted-imports` (a warning now; an error after the migration).
