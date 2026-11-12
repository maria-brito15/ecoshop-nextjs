# Change spec: 012-camadas-e-tipos

- **Track:** no behavior (refactoring)
- **Affected capabilities:** AUTH, OPS
- **Status:** Implemented on 2026-11-11 (the owner's technical autonomy), **without commits**; consolidated in the living specs
- **Author / approver:** Claude / project owner · **Date:** 2026-11-11

## Problem

The `auth`, `auth/refresh`, `auth/me`, `users` and `health` handlers imported `@/lib/db`; `setAuthCookie(res: any)`; casts of `tipo`; `lib/auth/contracts.ts` without a consumer.

## Out of scope

Splitting `JwtService`, unifying `types/api.ts` with Zod/Prisma and decomposing `createUser` (they stay for a wave of their own with database tests).

## Requirements

No new REQ; covers the layer rule (Constitution Art. V).

## Recorded decision

None.

## Verification

`grep "@/lib/db" app/` empty; `tsc`; tests of waves 009–011.

## Open questions

None blocking.
