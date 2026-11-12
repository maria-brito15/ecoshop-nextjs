# Phase 5 · Living specs

**What was done:** 12 capabilities, 77 requirements in EARS (`When…, the system shall…`), each with an acceptance criterion, status and evidence.

**Honest snapshot (2026-11-10):** 40 ✅, the rest ◐/❌/❔. The ❌ and ❔ are the real backlog: MARCA approval, chat UI, metrics with a real source, a usable seed, pagination validation, 409 on duplicates, cache invalidation when renaming a brand, a Gemini network failure turning into 500.

**Lesson:** writing the spec *after* the code (retroactively) forces you to separate what the code does from what was intended. The "Open questions" of each spec are questions to the owner, not gaps to fill by assumption.

**Tools:** `spec-lint` (format), `trace-check` (REQ ↔ test ↔ status), `adr-index` (index and supersession chain), `impact-map` (file → capability/ADR).
