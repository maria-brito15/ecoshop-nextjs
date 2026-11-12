# SDD flow step by step

References: ADR-0001, Constitution (`.specify/memory/constitution.md`), skill `spec-driven-development`.

## 1. Choose the track
| Situation | Track |
|---|---|
| New behavior | Full |
| Code violates an existing spec | Fix |
| The correct behavior is different from the spec | Fix with a rule change |
| Refactoring, docs, infra | No behavior |

Find the impact: `node scripts/sdd/impact-map.mjs --worktree`.

## 2. Full track (example: `specs/001-perfil-proprio-usuario`)
1. Create `specs/NNN-name/` with `spec.md`, `plan.md`, `tasks.md` from `.specify/templates/`.
2. **G1:** the owner approves the spec (review it with the `spec-reviewer` agent).
3. **G2:** the owner approves the plan and the ADRs.
4. For each task: failing `REQ-…` test → code → passing test → commit.
5. **G3:** `npm run lint && npx tsc --noEmit && npm test && npm run sdd:check`.
6. Consolidate `docs/capabilities/<cap>/spec.md` and `status.md` (evidence and date).
7. **G4:** PR with the template filled in; CI green. After the merge, `specs/NNN` becomes immutable.

## 3. Fix track
Write the failing test with the REQ's ID (or create the REQ), fix it, update `status.md` (❌→✅), PR.

## 4. Where everything lives
General rules: Constitution · behavior: `docs/capabilities` · decisions: `docs/architecture/adr` · changes: `specs/` · historical snapshot: `docs/discovery`.

## 5. Routine
Every PR: CI + template. Monthly: the `sdd-drift` workflow opens an issue. End of a phase: review the Constitution and record it in `docs/learning/`.
