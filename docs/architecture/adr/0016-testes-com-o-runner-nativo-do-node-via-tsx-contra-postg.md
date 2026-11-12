# ADR-0016: Tests with Node's native runner (via tsx) against real Postgres and Redis

- Status: Accepted
- Date: 2026-11-10
- Deciders: Arthur (general authorization) and Claude
- Origin: new
- Capabilities: process

## Context
There were no tests at all. The Constitution (Art. II) requires tests per REQ, including integration with a real Postgres.

## Problem
Which test tool, without adding an unnecessary dependency?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. `node:test` + `tsx` (chosen, provisional) | Zero new dependencies; enough for services and Route Handlers | No React component utilities | — |
| B. Vitest | Ecosystem, mocks, watch | A new dependency | — |
| C. Jest | Familiar | Heavy config with ESM/TS | — |

## Decision
Option A for unit/integration; Playwright for E2E when there is a journey that justifies it (none yet). Reassess (Vitest) if component tests appear.

## Rationale
The smallest stack that covers the current pyramid; `tsx` is already a dependency.

## Consequences
Tests require `DATABASE_URL` and `REDIS_URL`; CI brings up the services. Affects: `tests/**`, CI.

## Verification
`npm test` in CI.
