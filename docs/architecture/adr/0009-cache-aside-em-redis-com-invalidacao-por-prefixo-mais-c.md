# ADR-0009: Cache-aside in Redis with prefix invalidation, plus a 30 s client cache

- Status: Inferred
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: CAT, PROD, REF

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `lib/cache/*` (`withCache`, `PREFIX`, `TTL`), invalidation by `SCAN`+`DEL`. Gap: products embed the brand and category, but changing a brand does not invalidate `produtos:*`.

## Problem
How do we reduce database reads while keeping acceptable consistency?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Cache-aside by prefix (current) | Simple | Manual, forgettable cross invalidation | — |
| B. Tags per entity | Precise invalidation | More code | — |
| C. No cache | Full consistency | More load on the database | — |

## Decision
Keep A as historical; the per-resource consistency policy is pending (P05, with measurement).

## Rationale
Inferred.

## Consequences
Stale data for up to 3–5 min after cross mutations. Affects: `lib/cache/**`, `services/**`.

## Verification
"Mutation X → read Y" tests (Art. IX).
