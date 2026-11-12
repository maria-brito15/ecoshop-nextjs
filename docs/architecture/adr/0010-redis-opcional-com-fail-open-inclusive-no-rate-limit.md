# ADR-0010: Optional Redis with fail-open, including in the rate limit

- Status: Superseded
- Superseded by: ADR-0020
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: AUTH, OPS

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `lib/redis.ts` swallows errors; `lib/rate-limit.ts` returns `bloqueado: false` if Redis fails; `/api/health` returns 503 when only Redis goes down.

## Problem
What happens when Redis is down?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Fail-open (current) | Availability | No limit on login attempts without Redis | — |
| B. Fail-closed on the rate limit | Security | Login unavailable without Redis | — |
| C. In-memory fallback per instance | Middle ground | Limit per instance | — |

## Decision
Keep A as historical; pending (P04). Inconsistency to decide: health treating Redis as required contradicts "optional".

## Rationale
Inferred: graceful degradation declared in the README.

## Consequences
Brute force without Redis. Affects: `lib/redis.ts`, `lib/rate-limit.ts`, `api/health`.

## Verification
Adapter tests with Redis simulated as failing (Art. VIII).
