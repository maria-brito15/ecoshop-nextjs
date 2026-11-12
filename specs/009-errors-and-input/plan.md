# Plan: 009-errors-and-input

- **Status:** Implemented on 2026-11-11 (G2 treated as granted by the owner's autonomy). No ADR: it follows Constitution Art. VI–VIII and ADR-0017, and decides no new architecture.

## Technical decisions

- **Domain errors (Art. VII):** two classes in `lib/errors/domain.ts`, `ResourceNotFound(resource)` (→ 404) and `BusinessConflict(message)` (→ 409). Art. VII gives names only as an example; two classes cover all current cases (nonexistence; repeated email, invalid type, brand not pending, self-deletion) without creating an unused hierarchy (YAGNI).
- **Single mapper:** `mapPrismaError` becomes `mapError`: it handles the domain errors first, then the Prisma codes (`err.code`), and no longer looks at `err.message`. The existing HTTP messages are preserved.
- **Unique constraint instead of checking first:** `createUser` and `updateUser` catch P2002 and throw `BusinessConflict("Email already registered")`; the prior check stays only as a friendly shortcut and now ignores case.
- **Route `id`:** `parseId(text)` in `lib/schemas/id.ts` (expression `^[1-9]\d{0,9}$` and limit 2147483647) and `routeId(params)` in `lib/http/params.ts`. Each handler responds `ERRORS.invalidData("Invalid ID")`.
- **Email and password:** `emailSchema` (`trim` + `toLowerCase` + `email`) and a password schema (minimum 8, maximum 72 bytes measured with `TextEncoder`, which also works in the browser) in `lib/schemas/user.ts`.
- **`next`:** `localPathOrRoot(value)` in `lib/http/next-url.ts`, a pure function used by the login screen.
- **Timeouts:** `fetchWithTimeout(url, init, ms)` in `lib/http/fetch-with-timeout.ts` uses `AbortSignal.timeout`. The providers receive the time as a parameter with a default value in a constant (testable without waiting 10 s).
- **Gemini:** the provider gains `generateWithHistory` and a "Gemini configured" check; the key goes in the `x-goog-api-key` header; the chat handler no longer has its own call. `generateText` now catches failures and returns `null` (the scan already falls back).

## Verification

Tests in `tests/integration/input-and-errors.test.ts`. The ones that do not need a database (mapper, `parseId`, schemas, `next`, timeouts, routes that respond 400 before touching the database, chat, scan) are run in this session; the ones that need a database (end-to-end 404/409, case-insensitive lookup) were written and run in CI. At the end: `tsc`, lint and `sdd:check`.
