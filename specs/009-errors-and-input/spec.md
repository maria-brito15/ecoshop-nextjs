# Change spec: 009-errors-and-input

- **Track:** fix (the Constitution Art. VI, VII and VIII already require this behavior; the code does not meet it) with a rule change in REQ-AUTH-15 to 17 and REQ-USR-08
- **Affected capabilities:** AUTH, USR, REF, CAT, PROD, MIDIA, CHAT, SCAN
- **Status:** Implemented on 2026-11-11 (technical autonomy granted by the owner); partial verification — see the `status.md` of each capability
- **Author / approver:** Claude / project owner · **Date:** 2026-11-11

## Problem

The audit of 2026-11-11 found, in data input and error handling:

- Services throw `Error("P2025")`, `Error("EMAIL_JA_CADASTRADO")`, `Error("MARCA_NAO_PENDENTE")` etc., and handlers decide the response by `err.message` (Art. VII.1–2).
- `PUT /api/usuarios/[id]` of a nonexistent user, a repeated email on update and deletion of a user who has a brand fall into **500** (the handler looks for `"P2025"` in the message, but Prisma puts the code in `err.code`) (Art. VII.4).
- An invalid route `id` (`abc`) becomes `NaN`, Prisma throws a validation error and the response is **500** (Art. VI.1).
- Email without normalization: `A@x.com` and `a@x.com` are different accounts.
- Password without a maximum limit: bcrypt only uses the first 72 bytes.
- The login screen's `?next=` is used without validation: open redirect.
- Chat: `historico` without a size limit; Gemini key in the URL; the Gemini call duplicated in the handler.
- Calls to Azure and Gemini without a timeout; a Gemini network failure in the scan becomes 500 (Art. VIII.2; REQ-SCAN-05 already required 200 with a fallback).

## Out of scope

- Requiring the current password to change the password → session spec (010), because it changes the API contract and the profile screen.
- A `codigo` field in the error body (Art. VII.3) and splitting handlers into services → layers spec (012).
- A migration that normalizes emails already stored: the lookup now ignores case, so old accounts keep logging in without a migration.
- Changing existing error messages.

## Current behavior (fact, with evidence)

- `services/user.service.ts:100,218`, `services/brand.service.ts:115,118,143,146,216`, `services/category.service.ts:147`, `services/certificate.service.ts:126`: `throw new Error("<text>")`.
- `app/api/usuarios/[id]/route.ts:103,135`: `err.message.includes("P2025")`; `app/api/marcas/[id]/aprovar/route.ts`, `app/api/marcas/route.ts`, `app/api/users/route.ts`, `app/api/usuarios/route.ts`: comparison of `err.message` with strings.
- `lib/http/responses.ts`: `mapError` also compares `err.message === "P2025"`.
- `[id]` routes: `Number(id)` without validation (products, users, brands, approve, categories, certificates); only `fotos` checks `isNaN`.
- `lib/schemas/user.ts`: email only `z.string().email()`; password `min(8)`.
- `app/(auth)/sign-in/page.tsx:200`: `get("next") || "/"` without validation.
- `lib/schemas/ai-chat.ts`: only `mensagem` has a limit. `app/api/ia/chat/route.ts` builds the Gemini URL with `?key=` and has its own text-with-history function.
- `lib/ai/providers/*.ts`: `fetch` without `signal`; `generateText` without `try/catch`.
- `tests/integration/ecoscan.test.ts:117`: the REQ-SCAN-05 test is marked `todo: "D4: hoje a exceção vira 500"`.

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-CAT-09 | If the `id` of `GET /api/produtos/[id]` is not a positive integer, the system shall respond 400. | `abc`, `0`, `-1`, `1.5`, `1e3` → 400 (not 500) | New |
| REQ-PROD-06 | If the `id` of `PUT` or `DELETE /api/produtos/[id]` is not a positive integer, the system shall respond 400. | ADMIN with `id=abc` → 400 | New |
| REQ-MIDIA-05 | If the `id` of the photo routes is not a positive integer, the system shall respond 400. | `1.5` and `abc` → 400 | New |
| REQ-REF-05 | If the `id` of the category, brand or certificate routes is not a positive integer, the system shall respond 400. | `abc` → 400 on GET, PUT and DELETE | New |
| REQ-USR-06 | If the `id` of `/api/usuarios/[id]` or of `POST /api/marcas/[id]/aprovar` is not a positive integer, the system shall respond 400 (after checking the session). | ADMIN with `id=abc` → 400; without a session → 401/403 | New |
| REQ-USR-07 | When a user update or deletion fails because the user does not exist, the email is repeated or there is a link to a brand, the system shall respond 404, 409 and 409, respectively. | `PUT` of a nonexistent id → 404; `PUT` with another user's email → 409; `DELETE` of a user with a brand → 409 | New |
| REQ-USR-08 | If an ADMIN tries to delete their own account, the system shall respond 409 and keep the account. | `DELETE /api/usuarios/<my id>` → 409 | New (rule) |
| REQ-AUTH-15 | The system shall normalize the email (trim the ends and lowercase it) on sign-up, login and update, and look users up ignoring case; when signing up a MARCA with an already existing brand name, it shall respond 409. | Signing up `Foo@X.com` stores `foo@x.com`; signing up `foo@x.com` afterwards → 409; an old mixed-case account still signs in | New (rule) |
| REQ-AUTH-16 | If the password given on sign-up or update exceeds 72 bytes, the system shall respond 400. | 73 bytes → 400; 72 → accepted | New (rule) |
| REQ-AUTH-17 | When login redirects through `?next=`, the system shall accept only a local path (starts with a single `/`); any other value leads to `/`. | `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:…` → `/` | New (rule) |
| REQ-CHAT-08 | If the chat `historico` has more than 20 items, or any text exceeds 2000 characters, the system shall respond 400; the Gemini key shall not go in the URL. | 21 items → 400; the call to Gemini carries the key in the `x-goog-api-key` header, without `key=` in the URL | New (rule) |
| REQ-CHAT-09 | If the call to Gemini throws or exceeds the time limit, the chat shall respond 502. | A `fetch` that throws → 502 (not 500) | New |
| REQ-SCAN-09 | The system shall apply a timeout to the calls to Azure and to Gemini and treat the overrun as a dependency failure (REQ-SCAN-05 and REQ-SCAN-07). | A call that does not respond is aborted at the timeout; the scan returns the fallback (Gemini) or 422 (Azure) | New |

REQ-SCAN-05 (Gemini fails because of the network → 200 with a fallback) already existed; this spec fixes the code and removes the test's `todo`.

## Scenarios and edge cases

- **`id`:** only digits, no sign, no leading zeros and up to 2,147,483,647 (Postgres' 4-byte integer). `1e3`, `1.5`, ` 7`, `007`, `0`, empty and larger numbers are invalid.
- **Order in `usuarios/[id]`:** first the session and ownership (401/403), then the `id` (400); a regular user who passes an invalid `id` receives 403, revealing nothing.
- **Old mixed-case email:** login and the duplicate check compare ignoring case; there is no migration. Two old accounts that differ only by case are not touched.
- **Simultaneous sign-up of the same email:** the database's unique constraint decides; the P2002 error becomes 409 "Email already registered".
- **Chat limits:** 20 items, 2000 characters per text and 5 parts per item are limits chosen by this spec (they mirror the `mensagem` limit); adjustable if real usage asks for it.
- **Timeouts:** Azure 10 s and Gemini 20 s are initial values chosen by this spec, without measurement ❔; they stay in named constants.

## Business rules and constraints

- Constitution Art. VI.1 (validate params), Art. VII.1–2 and 4 (typed domain errors, no `message.includes`, FK → 409), Art. VIII.2 (a timeout on every network call).
- Existing messages and HTTP codes do not change: what changes is the origin of the decision (the error's type) and the cases that today become 500.
- It changes no Accepted ADR.

## Affected interfaces

`lib/errors/domain.ts` (new) · `lib/http/responses.ts` · `lib/http/params.ts` and `lib/schemas/id.ts` (new) · `lib/http/fetch-with-timeout.ts` (new) · `lib/http/next-url.ts` (new) · `lib/schemas/user.ts` · `lib/schemas/ai-chat.ts` · `lib/ai/providers/*.ts` · `services/{user,brand,category,certificate}.service.ts` · handlers of `produtos`, `usuarios`, `marcas`, `categorias`, `certificados`, `auth`, `users`, `ia/chat` · `app/(auth)/sign-in/page.tsx`.

## Delta in the living spec

New REQs in the eight capabilities above, with rows in each `status.md`; `ecoscan/status.md`: REQ-SCAN-05 ◐→✅ when the test passes.

## Open questions

None blocking. The chat limits and the timeouts (values above) can be revised with usage data.
