# ADR-0015: ESLint 9 (flat config) and Prettier, instead of `next lint`

- Status: Accepted
- Date: 2026-11-10
- Deciders: Arthur (general authorization) and Claude
- Origin: new
- Capabilities: process

## Context
`npm run lint` called `next lint`, deprecated in Next 15, without ESLint installed: the command opened an interactive wizard and failed in CI (D10), blocking the docker and deploy jobs.

## Problem
How do we get a lint that works in CI without a mass refactor?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. ESLint 9 + eslint-config-next + Prettier (chosen) | Ecosystem standard, works in CI | 31 pre-existing warnings | — |
| B. Biome | One tool | Fewer Next/React rules | — |

## Decision
Option A. Rules that produced errors in the existing code (`no-explicit-any`, `no-empty-object-type`, `no-html-link-for-pages`) stay as a **warning** until fixed by change specs; new code must be clean. `no-restricted-imports` of `@/lib/db` in `app/**` applies Art. V (a warning for now).

## Rationale
It unblocks CI without a mass refactor.

## Consequences
Warnings can be ignored; review in Phase 4. Affects: `eslint.config.mjs`, `package.json`, CI.

## Verification
`npm run lint` in CI.
