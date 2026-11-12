# Phase 4 · Tests as an executable specification

**What was done:** 47 integration tests (`node:test` + `tsx`, against real Postgres and Redis; Azure/Gemini simulated). Each test carries the requirement ID in its title.

**Concepts**
- *Characterization test*: describes the correct behavior of something still broken and stays `todo` (it does not break CI, but it shows up). E.g. REQ-CAT-05, REQ-REF-02. When the defect is fixed, the `todo` is removed — that is what happened with REQ-PERF-01 in the pilot.
- *Traceability*: `trace-check` fails if a ✅ REQ has no active test, or if a test cites a nonexistent REQ. It is what stops the spec from lying.

**Findings while writing the tests:** `POST /api/usuarios` also returned the password hash (besides `PUT`); deleting a category with products responds 404 and not 409, because the code looks for "P2025" in `err.message` and Prisma's message includes a code excerpt with that text.

**Defects fixed here (owner's decision):** D2 (exposed password hash) and D3 (public, unlimited AI chat).
