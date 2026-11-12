# Phase 6 · Governance against drift

**Mechanisms:** `npm run sdd:check` in CI (blocking); `impact-map --exige-adr` fails a PR that changes a sensitive path without citing the ADR; PR template with track, capabilities, REQs and ADRs; a monthly `sdd-drift` workflow that opens an issue with `trace-check --stale`; `CODEOWNERS` (replace `@DONO`).

**Core idea:** drift is not avoided with better documentation; it is avoided by making part of the spec executable and having a detector confront the rest with the code.

**What stays human:** approving spec and plan, deciding whether a divergence is a bug or an old spec, amending the Constitution.
