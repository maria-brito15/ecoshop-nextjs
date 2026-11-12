# ADR-0007: Stateless session: JWT HS256 in an httpOnly cookie for 7 days, without revocation

- Status: Superseded
- Superseded by: ADR-0021
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: AUTH, AUTZ

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `lib/auth/jwt.ts` (`setExpirationTime('7d')`, `httpOnly` cookie, `sameSite: lax`); `/api/auth/refresh` only reissues if the type changed. The README says `SameSite=Strict`, the code uses `lax`.

## Problem
How do we keep a session, and how fast should a role change or a deletion take effect?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Long JWT without revocation (current) | Simple; works on the Edge | A deleted or demoted user keeps access for up to 7 days | — |
| B. Short JWT + refresh in Redis/database | Fast revocation | More components | — |
| C. Session in the database | Immediate revocation | A database read per request | Edge without database access |

## Decision
Keep A as historical. The definitive decision is pending (P02): with no production yet, it is the best moment to decide.

## Rationale
Inferred: simplicity.

## Consequences
Implicitly accepted risk. Affects: `lib/auth/**`, `middleware.ts`.

## Verification
REQ-AUTH in docs/capabilities/autenticacao.
