# Phase 3 · Honest documentation

**What changed:** the README had promises that the code does not keep (e-commerce with a cart, brand filter, gallery, seed credentials, `SameSite=Strict`). It was rewritten lean; the original stayed in `docs/discovery/2026-11-baseline/`.

**Lesson:** documentation of intent and documentation of behavior are different things. The living spec is only worth anything if each line says what the code does today (status ✅ ◐ ❌ ❔) and proves it with evidence. The README now points to it instead of competing with it.

**Also:** `prisma/schema.txt` (a duplicated copy of the schema) was removed and `.gitignore` stopped ignoring `prisma/migrations/**/*.sql`, which must be versioned.
