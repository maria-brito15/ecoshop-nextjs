# ADR-0001: Adopt SDD with a living spec per capability and Spec Kit change specs

- Status: Accepted
- Date: 2026-11-10
- Deciders: Arthur (general authorization) and Claude
- Origin: new
- Capabilities: all

## Context
EcoShop is an existing (brownfield) system. The diagnosis (docs/discovery/2026-11-baseline) shows intent scattered across the README and the comments, diverging from the code (e.g. D1), with no tests and no record of decisions. Spec Kit generates one spec per feature, which ages after the merge.

## Problem
How do we get a source of truth for behavior that does not age, while keeping the Spec Kit command flow?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Spec Kit only (one spec per feature) | Ready-made flow | Old specs age; nobody knows the current behavior without reading them all | A view of the present |
| B. Spec Kit + living spec per capability (chosen) | The present is always readable; immutable history | A consolidation step in every PR | Nothing relevant |
| C. Add OpenSpec | Native living spec through deltas | A second tool and a second set of source artifacts | Simplicity |

## Decision
Option B. `specs/NNN-*` (Spec Kit) records a change and is immutable after the merge; `docs/capabilities/<cap>/` is the living spec, updated at consolidation (gate G4). Three tracks proportional to the size of the change (doc 03 of the planning package, preserved in docs/discovery).

## Rationale
It gives the idea of "consolidated law + amendments" without a second tool, and keeps a single source artifact per kind of knowledge.

## Consequences
Positive: the present stays readable; drift is detectable by script. Negative: consolidation cost in every PR; it demands discipline in the tracks. Affects: every behavior change.

## Verification
`npm run sdd:check` in CI; the PR template requires capabilities and REQs.
