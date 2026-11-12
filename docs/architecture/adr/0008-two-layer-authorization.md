# ADR-0008: Authorization in two layers: middleware by prefix and a guard per handler

- Status: Superseded
- Date: 2026-11-10
- Deciders: Arthur (general authorization) and Claude
- Origin: inferred from the code
- Capabilities: AUTZ
- Superseded by: ADR-0017

## Context
Evidence: `middleware.ts` + `config/protected-routes.ts` (by prefix) and `app/_middleware/auth.ts` (`requireAuth`/`requireAdmin`). They diverged: the middleware required ADMIN on `/api/usuarios/*`, while the handler allowed the user themselves (D1).

## Problem
Where does the decision of who can do what live?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Two layers (current) | Defense in depth | Duplicated rules that diverge | — |

## Decision
Historical description of the state before ADR-0017, which supersedes it.

## Rationale
—

## Consequences
Cause of defect D1.

## Verification
—
