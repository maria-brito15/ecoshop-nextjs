# AUTH · Authentication (sign-up, login, session)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0018 · ADR-0020 · ADR-0021

## Goal

Let a person create an account, sign in, sign out and keep a secure session, with protection against mass attempts.

## Actors

Visitor · CLIENTE · MARCA · ADMIN (created only by an ADMIN or by the seed).

## Business rules

- **BR-AUTH-01** — Email is unique per user.
- **BR-AUTH-02** — An ADMIN cannot be created through public sign-up.
- **BR-AUTH-03** — The password has at least 8 characters and is stored with bcrypt (12 rounds).
- **BR-AUTH-04** — Signing up as MARCA requires approval by an ADMIN; while pending, the user has CLIENTE rights (owner decision, 2026-11-10; model in ADR-0018).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-AUTH-01 | When valid credentials are sent to login, the system shall respond 200 and set the `token` session cookie as httpOnly and SameSite=lax. | Valid POST /api/auth → 200, set-cookie header with token, HttpOnly, SameSite=lax; body without password |
| REQ-AUTH-02 | If the email does not exist or the password is wrong, the system shall respond with the same 401, without revealing which of the two failed. | Both responses have status 401 and an identical body |
| REQ-AUTH-03 | If the login body is invalid, the system shall respond 400. | malformed email and empty password → 400 |
| REQ-AUTH-04 | If the same IP makes more than 10 login attempts in 1 minute, the system shall respond 429. | The 11th attempt in 60 s → 429; the first 10 are not |
| REQ-AUTH-05 | When a public sign-up is valid, the system shall create a CLIENTE user (default), start the session and respond 201. | POST /api/users → 201, type CLIENTE, set-cookie token |
| REQ-AUTH-06 | If the sign-up email already exists, the system shall respond 409. | Sign-up with an existing email → 409 |
| REQ-AUTH-07 | The system shall never include the password or its hash in responses about users (login, sign-up, creation and update by an ADMIN). | The responses of login, sign-up, POST /api/usuarios and PUT /api/usuarios/[id] do not contain the `senha` field |
| REQ-AUTH-08 | If public sign-up asks for the ADMIN type, the system shall respond 400. | POST /api/users with type ADMIN → 400 |
| REQ-AUTH-09 | When the user signs out, the system shall remove the session cookie. | DELETE /api/auth → 200 and a set-cookie expiring token |
| REQ-AUTH-10 | When the session is valid, the system shall return the user's data at /api/auth/me; without a session, it shall respond 401. | GET /api/auth/me with and without the cookie |
| REQ-AUTH-11 | When someone signs up as MARCA, the system shall record the request as pending (CLIENTE user + `Marca` with status PENDENTE) and grant MARCA rights only after approval by an ADMIN. | Sign-up with type MARCA does not result in a MARCA user until approval; `Marca.status === "PENDENTE"` |
| REQ-AUTH-12 | If the sign-up password has fewer than 8 characters, the system shall respond 400. | POST /api/users with a 7-character password → 400 |
| REQ-AUTH-13 | When a user is deleted or has the role changed, the system shall end or invalidate their existing sessions within a period to be defined. | A token issued before the deletion stops being valid within N minutes (N to be decided) |
| REQ-AUTH-14 | If sign-up asks for `tipo: "MARCA"` without the brand name, the system shall respond 400. | POST /api/users with type MARCA and without `marcaNome` → 400 |
| REQ-AUTH-15 | The system shall normalize the email (trim the ends and lowercase it) on sign-up, login and update, and look users up ignoring case; when signing up a MARCA with an already existing brand name, it shall respond 409. | Signing up `Foo@X.com` stores `foo@x.com`; signing up `foo@x.com` afterwards → 409; an old mixed-case account still signs in |
| REQ-AUTH-16 | If the password given on sign-up or update exceeds 72 bytes (the useful bcrypt limit), the system shall respond 400. | 73 bytes → 400; 72 → accepted; `ç` × 37 (74 bytes) → 400 |
| REQ-AUTH-17 | When login redirects through `?next=`, the system shall accept only a local path (starts with a single `/`, with no `\` or control characters); any other value leads to `/`. | `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:…` → `/` |
| REQ-AUTH-18 | The access JWT shall expire in 15 minutes. | `exp` of the issued token ≈ now + 900 s |
| REQ-AUTH-19 | When login or sign-up succeeds, the system shall also issue an opaque refresh token (`refresh` cookie, 7 days, stored only as a hash in Redis); refreshing shall consume it (single use), re-read the user's role from the database and issue a new pair; without Redis, login works without refresh and refresh responds 503. | Reusing a token → refused; two simultaneous requests → one refreshes; Redis down → 503; a demoted admin becomes CLIENTE on refresh |
| REQ-AUTH-20 | When the user logs out, changes the password or is deleted, the system shall revoke the refresh tokens (logout: the session's; password change and deletion: all of the user's), without failing if Redis is down. | After revoking, refresh is refused; other users' sessions are untouched |
| REQ-AUTH-21 | When the user changes their OWN password, the system shall require the correct `senhaAtual` (403 "Current password is incorrect"); an ADMIN changing another user's password does not need it. | Without `senhaAtual` or wrong → 403; correct → 200 |
| REQ-AUTH-22 | When a protected page receives an expired access token but there is a refresh token, the system shall refresh and return to the same page; on failure, take the user to login with `next`. | Middleware redirects to `/api/auth/refresh?next=/perfil?aba=2` |
| REQ-AUTH-23 | Login shall run the bcrypt comparison even when the email does not exist, so that the response time does not reveal which emails have an account. | Time with a nonexistent email is of the same order as with an existing email |

## Edge cases

Without Redis, the attempt limit still applies per instance, with an in-memory counter (ADR-0020). The client IP is the N-th entry, counted from the end, of x-forwarded-for (N = TRUST_PROXY_HOPS, default 1; REQ-OPS-16); with N = 0 the header is ignored.

## Interfaces

POST/DELETE /api/auth · POST /api/users · GET /api/auth/me · POST and GET /api/auth/refresh (refreshes the session with the `refresh` cookie; without it, reissues the token when the type in the database differs). Cookies `token` (JWT HS256, 15 minutes) and `refresh` (opaque, 7 days, single use, revocable; ADR-0021).

## Applicable NFRs

NFR-SEG-01, NFR-SEG-02, NFR-SEG-03.

## Out of scope

Password recovery, email verification, social login, MFA.

## Open questions

1. What session duration and revocation policy (P02)?
