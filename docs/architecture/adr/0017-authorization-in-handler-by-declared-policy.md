# ADR-0017: Authorization decided in the handler by declared policy; the middleware only filters pages and admin-only routes

- Status: Accepted
- Date: 2026-11-10
- Deciders: Arthur (general authorization) and Claude
- Origin: new
- Capabilities: AUTZ, PERF
- Supersedes: ADR-0008

## Context
D1: the middleware required ADMIN on every `/api/usuarios/*`, but `GET/PUT /api/usuarios/[id]` was written to allow the user themselves; the profile page uses it. The middleware (Edge) does not know the owner of the resource. Approval: Arthur's general authorization on 2026-11-10 to run the roadmap; **review** if another option is wanted.

## Problem
Where does the per-resource access decision live?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. In the handler (chosen) | One source of truth per route; supports "own resource" | Each handler must declare the guard; the matrix test covers it | — |
| B. Only in the middleware | Centralized | Does not know the resource owner on the Edge | Per-resource rules |
| C. Two layers generated from the same table | Defense in depth | Complexity | — |

## Decision
Option A. The middleware now requires only **authentication** on `/api/usuarios` (401 without login); the access level (admin or own) is decided by the handler. The `/painel` page stays restricted to ADMIN in the middleware (there is no "own resource" there).

## Rationale
BR-06 ("a user sees/edits only their own profile, except ADMIN") requires knowing the resource.

## Consequences
New routes must declare access in the handler; the matrix is covered by a test. Affects: `config/protected-routes.ts`, `api/usuarios/**`.

## Verification
REQ-AUTZ-*/REQ-PERF-* tests in `tests/integration`.
