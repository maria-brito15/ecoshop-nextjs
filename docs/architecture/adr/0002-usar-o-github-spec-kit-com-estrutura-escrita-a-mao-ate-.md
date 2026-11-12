# ADR-0002: Use GitHub Spec Kit with a hand-written structure until a version is pinned

- Status: Accepted
- Date: 2026-11-10
- Deciders: Arthur (general authorization) and Claude
- Origin: new
- Capabilities: process

## Context
Spec Kit changes fast (extensions, presets, commands that are sometimes `/speckit.plan`, sometimes `speckit-plan` skills). The environment that created this structure could not reach the Spec Kit repository, so `specify init` could not be run.

## Problem
How do we start using the flow without fixing wrong assumptions about the tool?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Write `.specify/` by hand following the documented convention (chosen) | Works now; easy to reconcile | May diverge from the real version | — |
| B. Wait to run `specify init` | Official structure | Blocks everything else | Phases 1–7 |
| C. Do not use Spec Kit | Less dependency | Loses the roadmap and templates | The learning goal |

## Decision
Option A. Structure in `.specify/` documented in `.specify/README.md`. **Open item:** run `specify init --here --integration claude` on a copy, with a pinned version, compare and record the version in this ADR (which then gains a "Pinned version" section).

## Rationale
A reversible, low-cost decision; the value is in the artifacts (Constitution, templates), not in the generator.

## Consequences
Negative: the `/speckit.*` commands may expect different files from the ones written here. Mitigation: documented reconciliation. Affects: `.specify/**`.

## Verification
Mandatory review the first time `/speckit.*` is run.
