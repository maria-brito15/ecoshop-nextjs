# ADR-0021: Session with a short access token (JWT, 15 min) and an opaque, revocable refresh token in Redis

- Status: Accepted
- Date: 2026-11-11
- Deciders: project owner (options "short token + refresh" and "without Redis, refresh is denied", 2026-11-11) and Claude
- Origin: new (ratifies and supersedes ADR-0007)
- Capabilities: AUTH, AUTZ
- Supersedes: ADR-0007

## Context

ADR-0007 (Inferred): a 7-day HS256 JWT in an httpOnly cookie, without revocation. The audit of 2026-11-11 showed that a demoted admin, a deleted user or a hijacked session stay valid for up to 7 days, and that changing the password ends no session. The owner chose a short access token with a revocable refresh (P02) and, without Redis, refresh denied. The project runs with one instance.

## Problem

How do we allow revoking sessions and propagating a role change without querying the database on every request?

## Alternatives

| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Short access JWT + opaque refresh token in Redis (chosen) | Revocation and re-reading the role at each refresh; access verification still needs no network | Depends on Redis to refresh; one more cookie; a window of up to 15 min for an access token already issued | — |
| B. Session version column on `Usuario` | Immediate revocation without Redis | A database query per authenticated request (or a cache) | Network-free verification in the middleware (edge) |
| C. Keep ADR-0007 | No change | No revocation for 7 days | Any response to a hijacked session |

## Decision

Option A.

- **Access:** HS256 JWT, `token` cookie, 15 minutes (`lib/auth/constants.ts`). Verified without querying Redis, including in the middleware.
- **Refresh:** 256 random bits, `refresh` cookie (httpOnly, `SameSite=lax`, `secure` in production, 7 days). Only the SHA-256 hash is kept in Redis (`refresh:<hash>` → user id; `refresh_user:<id>` → set of hashes).
- **Single use (rotation):** refreshing deletes the token with `GETDEL` and issues a new pair; two simultaneous requests with the same token refresh only one. The user's role is re-read from the database.
- **Revocation:** logout revokes the session's token; changing the password and deleting the user revoke all of the user's.
- **Without Redis:** login works, without a refresh token (the session lives 15 min); refresh responds 503 and clears the cookies (the user signs in again).
- **Pages:** the middleware, on seeing an expired access token with `refresh` present, redirects to `GET /api/auth/refresh?next=…`, which refreshes and returns (local path only).
- **Compatibility:** earlier sessions (7-day `token` cookie, without `refresh`) stay valid until they expire; for them `POST /api/auth/refresh` keeps the old behavior (reissues if the role changed).

## Rationale

It trades Redis availability for refresh (accepted by the owner) for real revocation and a known maximum window (15 min) between a role change and its effect. The 15-minute value is initial, with no usage measurement ❔.

## Consequences

- In an environment with unstable Redis, logged-in users are logged out every 15 minutes.
- An access token already issued cannot be revoked before it expires (max. 15 min).
- Changing one's OWN password requires `senhaAtual` (REQ-AUTH-21).
- Affects: `lib/auth/**`, `services/session.service.ts`, `services/user.service.ts`, `app/api/auth/**`, `app/api/users/route.ts`, `middleware.ts`.

## Verification

`tests/integration/session.test.ts`: service with an in-memory store; real store in Redis (hash, single use, revocation); middleware; and, with a database, login cookies and current password.
