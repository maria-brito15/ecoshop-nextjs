# ADR-0003: Next.js monolith (App Router) with front end and API in the same deploy

- Status: Inferred
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: all

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `app/` (pages per Route Group) and `app/api/**` (17 Route Handlers) in the same project; `output: 'standalone'` in `next.config.ts`; a single Dockerfile for the application.

## Problem
How do we organize front end and back end for a one-person project?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Next.js monolith (current) | One deploy, one repository, shared types | Couples the UI and API lifecycles | An API reusable by other clients |
| B. SPA + separate API | Scales and versions separately | Two deploys and contracts to maintain | Simplicity |
| C. Server Components accessing services directly | Less internal HTTP | UI rewrite | — |

## Decision
Keep A (historical decision). There is no evidence that it was compared with B or C.

## Rationale
Inferred: suited to the size of the project (6 entities, one person).

## Consequences
There is no external consumer of the API today; if one appears, reassess. Affects: the overall structure.

## Verification
Review when there is a second client of the API.
