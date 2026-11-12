---
name: requirements-engineering
description: Use to elicit, analyze and structure requirements before designing or coding: turn a request into testable requirements with an ID, acceptance criterion and open questions.
---

# Requirements engineering (EcoShop)

## Where to write
- Current/target behavior: `docs/capabilities/<cap>/spec.md` (living requirements) and `status.md`.
- New change: `specs/NNN-*/spec.md` (delta), citing the affected REQs.

## Format
- ID `REQ-<CAP>-NN` (CAP in `sdd.config.json`), business rule `BR-<CAP>-NN`, non-functional `NFR-…`. IDs are never reused.
- Statement in EARS: "When <event>, the system shall <response>"; "If <condition>, the system shall …"; "The system shall never …".
- Decidable acceptance criterion: input → observable output/status. If it cannot become a test, say how to verify it by hand.
- Status ✅ ◐ ❌ ❔ with evidence (`test:`, `manual: YYYY-MM-DD …`, `code:`).

## How to work
1. Separate fact (seen in code/tests), inference, recommendation and doubt.
2. Note open questions in the spec instead of deciding alone.
3. Each requirement answers: who, when, what, how to know it is right.
4. Run `node scripts/sdd/spec-lint.mjs` when done.

## Avoid
Vague requirements ("fast", "secure"), several behaviors under one ID, a solution disguised as a requirement.
