---
name: software-architecture
description: Use to evaluate designs, trade-offs and technical decisions (structure, dependency, data model, pattern) and record the decision as an ADR with alternatives and consequences.
---

# Architecture and ADRs (EcoShop)

## When to create an ADR
A change to a sensitive path in `sdd.config.json`, a new runtime dependency, a Prisma schema change, or a decision the next developer cannot deduce from the code. Pending decisions: `docs/architecture/adr/pending.md`.

## Steps
1. Read the current ADRs for the area and the Constitution; do not contradict them without amending/superseding.
2. List 2–3 real alternatives, with cost and risk; recommend one and say why.
3. Write `docs/architecture/adr/NNNN-title.md` from `0000-template.md` (Context, Decision, Alternatives, Positive and negative consequences, Status, Supersedes).
4. Initial status "Proposed". Only the owner changes it to "Accepted" (gate G2). An accepted ADR is not edited: create another with `Supersedes: ADR-NNNN`.
5. Run `node scripts/sdd/adr-index.mjs` to update the index.

## Distinguish
Decision made (fact) · decision inferred from the code (inference, mark it as such) · recommendation (proposal).
