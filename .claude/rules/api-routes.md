---
paths: ["app/api/**"]
---
- Validate input with Zod (`lib/schemas`) before using it; validation error → 400 with `{ error }`.
- Access decision in the handler: `requireAuth`/`requireAdmin` (`app/_middleware/auth.ts`) and owner check (ADR-0017). 401 without a session, 403 without permission.
- Call `services/`; do not import `@/lib/db` in the handler (Art. V).
- Map known errors (404, 409) instead of letting them become 500; never return a password hash.
- Changed behavior? Update the REQ and the `REQ-…` test in the same change.
