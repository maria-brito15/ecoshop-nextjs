# Change spec: 010-revocable-session

- **Track:** fix with a rule change (P02; supersedes ADR-0007)
- **Affected capabilities:** AUTH, AUTZ
- **Status:** Implemented on 2026-11-11 (the owner's technical autonomy), **without commits**; consolidated in the living specs
- **Author / approver:** Claude / project owner · **Date:** 2026-11-11

## Problem

A 7-day session without revocation: a demoted admin, a deleted user and a hijacked session stay valid; changing the password ends no sessions; changing one's own password does not require the current one; login revealed, through timing, which emails have an account.

## Out of scope

A password-change screen in the profile (today there is no field), logout of all devices by user action, login auditing.

## Requirements

REQ-AUTH-18 to 23 (`docs/capabilities/authentication`).

## Recorded decision

ADR-0021 (supersedes ADR-0007).

## Verification

`tests/integration/session.test.ts` (22 tests; the HTTP ones with a database **were not run**).

## Open questions

None blocking.
