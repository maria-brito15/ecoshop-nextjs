---
name: spec-driven-development
description: Use to run the specification→implementation flow for a change in EcoShop (spec, plan, tasks, tests, verification and syncing the living specs). Trigger on features, fixes that change behavior, and requests to check something against the spec.
---

# SDD in EcoShop

Two layers (ADR-0001): a living spec per capability (`docs/capabilities/`) and a change spec (`specs/NNN-*`, Spec Kit).

## Tracks
| Track | When | Artifacts |
|---|---|---|
| Full | New capability/behavior | `specs/NNN/{spec,plan,tasks}.md` + ADR if applicable |
| Fix | Code violates an existing spec | test with REQ + fix + `status.md` |
| Fix with a rule change | The correct behavior changes the spec | short change spec + living-spec amendment |
| No behavior | Refactoring, docs, infra | PR declares "no behavior change" |

## Gates (the owner approves)
G0 track chosen · G1 spec approved · G2 plan/ADR approved · G3 tests pass and specs consolidated · G4 PR reviewed.

## Steps
1. `node scripts/sdd/impact-map.mjs --worktree` to see the affected capabilities/ADRs.
2. Spec (G1) → plan (G2) → tasks, each with a REQ and "done when".
3. Failing test first (`test("REQ-XXX-NN: …")`); then the code; one commit per task.
4. Verify: lint, tsc, `npm test`, `npm run sdd:check`.
5. Consolidate the capability's `spec.md` and `status.md` with evidence. Never leave silent drift.
6. Unresolved open question: record it, do not decide on your own.
